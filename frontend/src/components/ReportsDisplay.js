import React, { useContext, useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './ReportDisplay.css';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Login from './Login';
import { Store } from '../Store';
import { Modal, ModalBody } from "reactstrap";

const ReportsDisplay = () => {
  const location = useLocation();
  const { file_key, reportId, amount = 400 } = location.state || {};
  console.log("Received file_key:", file_key, "reportId:", reportId, "amount:", amount, "location.state:", location.state);

  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { isLogin, name, status, email } = state;

  console.log("ReportsDisplay - isLogin:", isLogin); // Debug

  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState(''); // Added to track errors

  const handlePayment = () => {
    console.log("handlePayment - isLogin:", isLogin, "reportId:", reportId, "amount:", amount);
    if (!isLogin) {
      setOpenModel(true);
    } else if (!reportId) {
      setError('Please generate a report first');
    } else {
      navigate("/payment", { state: { reportId, amount, file_key } });
    }
  };

  const changeStatus = () => {
    setOpenModel(false);
    if (isLogin && status) {
      navigate("/payment", { state: { reportId, amount, file_key } });
    } else {
      cxtDispatch({ type: 'SET_REPORT_STATUS' });
    }
  };

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!file_key) {
        console.error("No file_key found. Skipping API request.");
        setError('No report selected. Please generate a report first.');
        setIsLoading(false);
        return;
      }
      console.log("Fetching presigned URL for file_key:", file_key);
      setIsLoading(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (isLogin) {
          const token = localStorage.getItem('token');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL', {
          method: 'POST',
          headers,
          body: JSON.stringify({ file_key, userId: isLogin ? state.userId : null }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        if (data.presigned_url) {
          setPdfUrl(data.presigned_url);
        } else {
          throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error('Error fetching presigned URL:', error.message, error.stack);
        setError(`Failed to load report: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [file_key, isLogin, state.userId]);

  return (
    <>
      <div className='report-display'>
        <nav className="navbar navbar-expand-lg bg-light">
          <div className="container-fluid">
            <div className="nav-left">
              <div className="logo">
                <Link to="/" className="navbar-brand">
                  <img src={logo} alt="" style={{ width: "60px", height: "60px" }} />
                </Link>
              </div>
              <div className="text">
                <p className='nav-title report-display-title' style={{ fontSize: "28px" }}>
                  {file_key ? file_key.replace(/_/g, ' ').replace(/\.[^.]+$/, '') : "Paper Industry In India"}
                </p>
                <p className='report-display-desc' style={{ marginTop: "-10px", width: "70%" }}>
                  {file_key ? "Generated report based on selected filters" : "Candy production is a seasonal business, with the majority of those involved in market normally doubling their staffs during the winter months"}
                </p>
              </div>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <button className="buy-btn" onClick={handlePayment} style={{ color: "white" }} disabled={!reportId}>
                    BUY NOW (₹{amount})
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className='viewer col-md-11 col-sm-11 col-11'>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {isLoading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : error ? (
              <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
            ) : pdfUrl ? (
              <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
            ) : (
              <p>No report available. Please generate a report first.</p>
            )}
          </Worker>
        </div>
      </div>
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(!openModel)}
        style={{ maxWidth: '650px', width: '100%', marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          <Login onClose={() => { setOpenModel(false); changeStatus(); }} />
          {status && (
            <div className='' style={{ textAlign: "center" }}>
              <p className='success-head'>The Report has been successfully sent to</p>
              <p className='success-email'>{email}</p>
              <button className='btn btn-primary' onClick={changeStatus}>Ok</button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default ReportsDisplay;

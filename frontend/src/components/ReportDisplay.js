import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store } from '../Store';
import { Modal, ModalBody } from 'reactstrap';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Login from './Login';
import logo from '../assets/logo.svg';
import './ReportDisplay.css';

const ReportDisplay = () => {
  const { state: { isLogin, userId, totalPrice, name, email, status }, dispatch: cxtDispatch } = useContext(Store);
  const location = useLocation();
  const navigate = useNavigate();
  const { file_key, reportId, amount = totalPrice || 400 } = location.state || {};
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');

  // Dynamically generate title based on file_key (to be enhanced later)
  const reportTitle = file_key ? file_key.replace(/_/g, ' ').replace(/\.[^.]+$/, '') : "Paper Industry In India";
  const reportDescription = file_key ? "Generated report based on selected filters" : "Candy production is a seasonal business, with the majority of those involved in market normally doubling their staffs during the winter months";

  console.log('ReportDisplay - Initial state:', { isLogin, userId, file_key, reportId, totalPrice, amount, reportTitle, reportDescription });

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!file_key) {
        console.error('No file_key found. Skipping API request.');
        setError('No report selected. Please generate a report first.');
        setIsLoading(false);
        return;
      }
      console.log('Fetching presigned URL for file_key:', file_key);
      setIsLoading(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (isLogin) {
          const token = localStorage.getItem('token');
          console.log('Token retrieved', { token: token ? token.substring(0, 10) + '...' : null });
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
        const response = await fetch('https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL', {
          method: 'POST',
          headers,
          body: JSON.stringify({ file_key, userId: isLogin ? userId : null }),
        });
        console.log('RBR_report_pre-signed_URL response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch pre-signed URL: ${errorText}`);
        }
        const data = await response.json();
        console.log('RBR_report_pre-signed_URL response:', data);
        if (data.presigned_url) {
          setPdfUrl(data.presigned_url);
        } else {
          throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error('Error fetching pre-signed URL:', error.message);
        setError(`Failed to load report: ${error.message}`);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [file_key, userId, isLogin]);

  const handleBuyNow = () => {
    console.log('handleBuyNow called', { isLogin, userId, file_key, reportId, amount, locationState: location.state });
    if (!isLogin) {
      console.log('Not logged in, opening login modal');
      setOpenModel(true);
    } else if (!reportId) {
      console.log('No reportId available');
      setError('Please generate a report first');
    } else {
      console.log('Navigating to /payment with reportId and amount:', { reportId, amount });
      navigate('/payment', { state: { reportId, amount } });
    }
  };

  const handleLoginSuccess = () => {
    setOpenModel(false);
    console.log('handleLoginSuccess called', { file_key, reportId, amount, isLogin, userId });
    if (reportId) {
      console.log('Login successful, navigating to /payment with:', { reportId, amount });
      navigate('/payment', { state: { reportId, amount } });
    } else {
      console.log('Login successful, but missing reportId');
      setError('Please generate a report first');
      navigate('/');
    }
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: 'SET_REPORT_STATUS' });
  };

  return (
    <>
      <div className="report-display">
        <nav className="navbar navbar-expand-lg bg-light">
          <div className="container-fluid">
            <div className="nav-left">
              <div className="logo">
                <Link to="/" className="navbar-brand">
                  <img src={logo} alt="Company Logo" style={{ width: '60px', height: '60px' }} />
                </Link>
              </div>
              <div className="text">
                <p className="nav-title report-display-title" style={{ fontSize: '28px' }}>
                  {reportTitle}
                </p>
                <p className="report-display-desc" style={{ marginTop: '-10px', width: '70%' }}>
                  {reportDescription}
                </p>
              </div>
            </div>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <button className="buy-btn" onClick={handleBuyNow} style={{ color: 'white' }}>
                    BUY NOW (₹{amount})
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="viewer col-md-11 col-sm-11 col-11">
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
        style={{ maxWidth: '650px', width: '100%', marginTop: '15%' }}
        size="lg"
      >
        <ModalBody>
          <Login onClose={handleLoginSuccess} />
          {status && (
            <div style={{ textAlign: 'center' }}>
              <p className="success-head">The Report has been successfully sent to</p>
              <p className="success-email">{email}</p>
              <button className="btn btn-primary" onClick={changeStatus}>
                Ok
              </button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default ReportDisplay;

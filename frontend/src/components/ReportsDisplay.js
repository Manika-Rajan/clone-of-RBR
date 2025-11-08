import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';
import './ReportsDisplay.css';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Login from './Login';
import { useStore } from '../Store';
import { Modal, ModalBody } from "reactstrap";

const ReportsDisplay = () => {
  const location = useLocation();
  const fileKey = location.state?.fileKey || '';
  const reportId = location.state?.reportId || '';
  console.log("Received fileKey:", fileKey, "reportId:", reportId);

  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useStore();
  const { isLogin = false, name = '', status = false, email = '' } = state || {};

  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [localFileKey, setLocalFileKey] = useState(fileKey);
  const [localReportId, setLocalReportId] = useState(reportId);

  useEffect(() => {
    console.log("ReportsDisplay - isLogin:", isLogin);
  }, [isLogin]);

  const handlePayment = () => {
    console.log("handlePayment - isLogin:", isLogin, "fileKey:", localFileKey, "reportId:", localReportId);
    
    // ✅ Save fileKey and reportId in Store for Payment
    cxtDispatch({ type: 'SET_FILE_REPORT', payload: { fileKey: localFileKey, reportId: localReportId } });
    
    setOpenModel(true);
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: 'SET_REPORT_STATUS' });
  };

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!localFileKey) {
        console.error("No fileKey found. Skipping API request.");
        setIsLoading(false);
        return;
      }
      console.log("Fetching presigned URL for fileKey:", localFileKey);
      setIsLoading(true);
      try {
        const response = await fetch('https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_key: localFileKey }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('API Response:', data);
        if (data.presigned_url) setPdfUrl(data.presigned_url);
        else throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error('Error fetching presigned URL:', error.message);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [localFileKey]);

  useEffect(() => {
    console.log("ReportsDisplay useEffect - isLogin updated to:", isLogin, "Path:", location.pathname);
    setLocalFileKey(fileKey);
    setLocalReportId(reportId);
  }, [isLogin, location.pathname, fileKey, reportId]);

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
                <p className='report-display-title' style={{ fontSize: "28px" }}>Paper Industry In India</p>
                <p className='report-display-desc' style={{ marginTop: "-10px", width: "70%" }}>
                  Candy production is a seasonal business, with the majority of those involved in market normally doubling their staffs during the winter months
                </p>
              </div>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <button className="buy-btn" onClick={handlePayment} style={{ color: "white" }}>BUY NOW</button>
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
            ) : pdfUrl ? (
              <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
            ) : (
              <div className="error-message">Failed to load report. No fileKey or API issue.</div>
            )}
          </Worker>
        </div>
      </div>
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(false)}
        style={{ maxWidth: '650px', width: '100%', marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          <Login
            onClose={() => setOpenModel(false)}
            returnTo="/payment"
          />
          {status && (
            <div style={{ textAlign: "center" }}>
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

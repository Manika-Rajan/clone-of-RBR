import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store } from '../Store';
import Login from './Login';
import './ReportsDisplay.css';

const ReportsDisplay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: cxtState, dispatch: cxtDispatch } = useContext(Store);
  const [openModel, setOpenModel] = useState(false);
  const [loginPhase, setLoginPhase] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ReportsDisplay.js:17 Received file_key:', location.state?.file_key, 'reportId:', location.state?.reportId, 'amount:', location.state?.amount, 'location.state:', location.state);
    if (location.state?.file_key) {
      console.log('ReportsDisplay.js:26 ReportsDisplay - isLogin:', cxtState.isLogin, 'state:', cxtState);
    }
    if (cxtState.isLogin && location.state?.loggedIn) {
      fetchReportData();
    }
  }, [location.state, cxtState.isLogin]);

  const fetchReportData = async () => {
    if (location.state?.file_key && cxtState.isLogin) {
      console.log('ReportsDisplay.js:70 Fetching presigned URL for file_key:', location.state.file_key, 'isLogin:', cxtState.isLogin);
      try {
        const response = await fetch(`https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL?file_key=${location.state.file_key}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('ReportsDisplay.js:83 Presigned URL response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('ReportsDisplay.js:93 API Response:', data);
          setReportData(data.url); // Assuming the URL is in data.url
          setError(null);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('ReportsDisplay.js:33 Error fetching presigned URL:', error);
        setError('Failed to load report due to a server issue. Please try again later.');
      }
    }
  };

  const handlePayment = () => {
    console.log('ReportsDisplay.js:35 handlePayment - isLogin:', cxtState.isLogin, 'reportId:', location.state?.reportId, 'amount:', location.state?.amount);
    if (!cxtState.isLogin) {
      console.log('ReportsDisplay.js:37 Triggering login modal - setting openModel to true');
      setOpenModel(true);
    } else {
      // Payment logic here
    }
  };

  const updateLoginPhase = (phase) => {
    console.log('ReportsDisplay.js:58 Updating loginPhase to:', phase);
    setLoginPhase(phase);
  };

  const handleClose = () => {
    setOpenModel(false);
    setLoginPhase(0);
  };

  return (
    <div className="reports-display">
      <div className="report-display-title">Report Display</div>
      <div className="report-display-desc">View your generated report details here.</div>
      <button className="buy-btn" onClick={handlePayment}>BUY NOW</button>
      {error && <div className="error-message">{error}</div>}
      {reportData && (
        <div className="viewer">
          <div className="pdf-div">
            <iframe src={reportData} title="Report" style={{ width: '100%', height: '100%', border: 'none' }} />
          </div>
        </div>
      )}
      {openModel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Login onClose={handleClose} onPhaseChange={updateLoginPhase} openModel={openModel} />
            <button className="buy-btn" onClick={handleClose}>Close</button>
          </div>
        </div>
      )}
      {location.state?.loggedIn && <div className="success-message">Logged in successfully, redirecting...</div>}
    </div>
  );
};

export default ReportsDisplay;

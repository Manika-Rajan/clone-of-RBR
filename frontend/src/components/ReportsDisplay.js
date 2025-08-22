import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store } from '../Store';
import Login from './Login'; // Ensure this import is stable

const ReportsDisplay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: cxtState, dispatch: cxtDispatch } = useContext(Store);
  const [openModel, setOpenModel] = useState(false);
  const [loginPhase, setLoginPhase] = useState(0);

  useEffect(() => {
    console.log('ReportsDisplay.js:17 Received file_key:', location.state?.file_key, 'reportId:', location.state?.reportId, 'amount:', location.state?.amount, 'location.state:', location.state);
    if (location.state?.file_key) {
      console.log('ReportsDisplay.js:26 ReportsDisplay - isLogin:', cxtState.isLogin, 'state:', cxtState);
    }
  }, [location.state, cxtState.isLogin]);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (location.state?.file_key && !cxtState.isLogin) {
        console.log('ReportsDisplay.js:70 Fetching presigned URL for file_key:', location.state.file_key, 'isLogin:', cxtState.isLogin);
        try {
          const response = await fetch(`https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/get-presigned-url?file_key=${location.state.file_key}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('ReportsDisplay.js:83 Presigned URL response status:', response.status);
          const data = await response.json();
          console.log('ReportsDisplay.js:93 API Response:', data);
        } catch (error) {
          console.error('Error fetching presigned URL:', error);
        }
      }
    };
    fetchPresignedUrl();
  }, [location.state?.file_key, cxtState.isLogin]);

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
    <div>
      <button onClick={handlePayment}>BUY NOW</button>
      {openModel && <Login onClose={handleClose} onPhaseChange={updateLoginPhase} openModel={openModel} />}
      {location.state?.loggedIn && <div>Logged in successfully, redirecting...</div>}
    </div>
  );
};

export default ReportsDisplay;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { useStore } from '../Store';

const Login = React.memo(({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState(state.phone.replace('+91', '') || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const renderTrigger = useRef(0);
  const componentId = useRef(Date.now().toString());

  useEffect(() => {
    setIsModalOpen(true);
    console.log(`Login [ID: ${componentId.current}] - isModalOpen updated to:`, isModalOpen, "state:", state, "renderTrigger:", renderTrigger.current, "returnTo:", returnTo);
    renderTrigger.current += 1;
  }, [returnTo]); // Add returnTo to dependency array

  const sendOtp = async () => {
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      const data = await response.json();
      console.log('send-otp response:', data);
      if (response.ok) {
        cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
        setOtpSent(true);
      } else {
        setError(`Error: ${data.error || 'Failed to send OTP'}`);
      }
    } catch (err) {
      console.error('send-otp error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp }),
      });
      const data = await response.json();
      console.log('verify-otp response:', data);
      if (response.status === 200) {
        const fetchedName = data.user?.name || phoneNumber;
        const fetchedEmail = data.user?.email || '';
        console.log(`Dispatching USER_LOGIN with isLogin: true, phone: ${phoneNumber}, name: ${fetchedName}, email: ${fetchedEmail}`);
        cxtDispatch({
          type: 'USER_LOGIN',
          payload: { isLogin: true, userId: phoneNumber, name: fetchedName, email: fetchedEmail, phone: phoneNumber }
        });
        console.log(`Post-dispatch state in Login:`, state);
        if (onClose) onClose();
        setIsModalOpen(false);
        // Use returnTo prop for redirection
        const { fileKey, reportId, amount } = location.state || {};
        console.log(`Navigating to ${returnTo} with state:`, { loggedIn: true, fileKey, reportId, amount });
        navigate(returnTo || '/report-display', { 
          state: { loggedIn: true, fileKey, reportId, amount },
          replace: true 
        });
      } else {
        setError(`Error: ${data.error || 'Invalid OTP'}`);
      }
    } catch (err) {
      console.error('verify-otp error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) sendOtp();
    else verifyOtp();
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  return (
    <div className={`login-popup-container ${!error && !isLoading && 'success-popup-container'}`}>
      <div className={`login-popup ${!error && !isLoading && 'success-popup'}`} style={{ display: isModalOpen ? 'block' : 'none' }}>
        {!isLoading && !error && (
          <div className="login-title">
            <h3>{otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
          </div>
        )}
        <div className="login-paragraph">
          {!otpSent && <p>We will send you a <strong>One Time Password</strong></p>}
        </div>
        {!otpSent ? (
          <div className="login-phone-input" style={{ width: '70%', textAlign: 'center', margin: 'auto' }}>
            <div className="input-group mb-3" style={{ marginRight: '20px', width: '23%' }}>
              <select className="form-select" aria-label="Default select example" disabled>
                <option selected>+91</option>
              </select>
            </div>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Your 10 digit Mobile Number"
                style={{ textAlign: 'center' }}
                value={phone}
                onChange={handleChange(setPhone)}
                maxLength={10}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={handleChange(setOtp)}
              maxLength={6}
              disabled={isLoading}
            />
          </div>
        )}
        <div>
          {!isLoading && !error ? (
            <button onClick={handleSubmit} className="login-button" disabled={isLoading}>
              {otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <p className="loading-message">Processing...</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default Login;

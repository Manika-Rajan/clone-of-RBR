import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added for navigation
import './Login.css';
import { Store } from '../Store';

const Login = ({ onClose, onPhaseChange, openModel }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Added to preserve state
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const [number, setNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(openModel); // Sync with parent

  useEffect(() => {
    setIsModalOpen(openModel); // Update when parent modal state changes
    console.log("Login - isModalOpen updated to:", isModalOpen, "openModel:", openModel, "otpSent:", otpSent);
  }, [openModel, otpSent]);

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) setNumber(storedPhone.replace('+91', ''));
  }, []);

  useEffect(() => {
    if (responseMessage === 'OTP sent! Enter it below:') {
      setOtpSent(true);
      if (onPhaseChange) onPhaseChange(1); // Update loginPhase to 1 for OTP phase
      console.log("useEffect - otpSent updated to true due to responseMessage");
    }
  }, [responseMessage, onPhaseChange]);

  const completeLogin = (phoneNumber, name, email) => {
    localStorage.setItem('userInfo', JSON.stringify({ isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }));
    cxtDispatch({
      type: 'USER_LOGIN',
      payload: { isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }
    });
    console.log('completeLogin called with:', { phoneNumber, name, email });
    setResponseMessage('Login successful');
    setTimeout(() => {
      if (onClose) {
        console.log('Calling onClose from completeLogin');
        onClose(); // This should sync with parent
      }
      setIsModalOpen(false); // Update local state
      navigate("/report-display", {
        state: { 
          loggedIn: true, 
          file_key: location.state?.file_key, 
          reportId: location.state?.reportId, 
          amount: location.state?.amount 
        },
        replace: true,
      });
    }, 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    console.log('handleSubmit triggered, otpSent:', otpSent);

    try {
      if (!otpSent) {
        if (number.length !== 10 || !/^\d+$/.test(number)) {
          setError('Please enter a valid 10-digit mobile number');
          return;
        }
        setError('');
        setResponseMessage('');
        setOtpInput('');
        const phoneNumber = `+91${number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber })
        });
        console.log('send-otp status:', response.status, 'at', new Date().toISOString());
        const data = await response.json();
        console.log('send-otp response:', data);
        if (response.ok) {
          setResponseMessage('OTP sent! Enter it below:');
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          localStorage.setItem('userPhone', phoneNumber);
        } else {
          setError(`Error: ${data.error || data.message || 'Unknown error'}`);
        }
      } else {
        if (otpInput.length !== 6 || !/^\d+$/.test(otpInput)) {
          setError('Please enter a valid 6-digit OTP');
          return;
        }
        setError('');
        setResponseMessage('');
        const phoneNumber = `+91${number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp: otpInput })
        });
        console.log('verify-otp status:', response.status, 'at', new Date().toISOString());
        const rawData = await response.json();
        console.log('verify-otp raw response:', rawData);
        let data = rawData;
        if (rawData.body && typeof rawData.body === 'string') {
          data = JSON.parse(rawData.body);
        }
        console.log('verify-otp parsed data:', data);
        if (response.status === 200) {
          setResponseMessage('OTP verified successfully');
          const fetchedName = data.user?.name || phoneNumber;
          const fetchedEmail = data.user?.email || '';
          completeLogin(phoneNumber, fetchedName, fetchedEmail);
        } else {
          setError(`Error: ${data.error || 'Invalid OTP'}`);
        }
      }
    } catch (err) {
      console.error('handleSubmit error:', err.message, err.stack, 'at', new Date().toISOString());
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className={`login-popup-container ${responseMessage === 'Login successful' ? 'success-popup-container' : ''}`}>
      <div className={`login-popup ${responseMessage === 'Login successful' ? 'success-popup' : ''}`} style={{ display: isModalOpen ? 'block' : 'none' }}>
        {responseMessage !== 'Login successful' && (
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
              <select className="form-select" aria-label="Default select example">
                <option selected>+91</option>
                <option value="2">+11</option>
              </select>
            </div>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Your 10 digit Mobile Number"
                style={{ textAlign: 'center' }}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                onKeyPress={handleKeyPress}
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
              value={otpInput}
              onChange={(e) => setOtpSent(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={isLoading}
            />
          </div>
        )}
        <div>
          {responseMessage === 'Login successful' ? (
            <div className="success-message">
              <svg
                className="checkmark"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <p>Login Successful!</p>
            </div>
          ) : (
            <button type="submit" className="login-button" onClick={handleSubmit} disabled={isLoading}>
              {otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          )}
        </div>
        {responseMessage && responseMessage !== 'Login successful' && (
          <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>
        )}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
};

export default Login;

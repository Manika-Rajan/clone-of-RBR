import React, { useState, useEffect, useContext } from 'react';
import './Login.css';
import { Store } from '../Store';

const Login = ({ onClose }) => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const [number, setNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [requireDetails, setRequireDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal starts open

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) setNumber(storedPhone.replace('+91', ''));
  }, []);

  useEffect(() => {
    // Auto-trigger continue for existing users after verification
    if (isVerified && !requireDetails && !isLoading) {
      console.log('useEffect triggered, calling handleContinue');
      handleContinue();
    }
  }, [isVerified, requireDetails, isLoading]);

  const saveUserDetails = async (phoneNumber, name, email) => {
    if (!phoneNumber || !name || !email) {
      throw new Error('Missing required fields for saving user details');
    }
    const requestBody = { action: 'update', phone_number: phoneNumber, name, email };
    console.log('saveUserDetails request:', requestBody);
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      console.log('saveUserDetails status:', response.status);
      const data = await response.json();
      console.log('saveUserDetails response:', data);
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error('saveUserDetails exception:', err.message, err.stack);
      throw new Error(`Failed to save user details: ${err.message}`);
    }
  };

  const completeLogin = (phoneNumber, name, email) => {
    const token = localStorage.getItem('authToken') || 'temp-token';
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
        onClose(); // Ensure modal closes
      }
      setIsModalOpen(false); // Fallback to local state
      if (onClose) onClose(); // Double call as fallback
    }, 2000);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    console.log('handleSubmit triggered, otpSent:', otpSent, 'isVerified:', isVerified, 'requireDetails:', requireDetails);

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
          setOtpSent(true);
        } else {
          setError(`Error: ${data.error || data.message || 'Unknown error'}`);
        }
      } else if (!isVerified) {
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
          setIsVerified(true);
          const fetchedName = data.user?.name || '';
          const fetchedEmail = data.user?.email || '';
          const isExistingUser = data.isExistingUser || false;
          setName(fetchedName && fetchedName !== phoneNumber && fetchedName.trim() !== '' ? fetchedName : '');
          setEmail(fetchedEmail);
          setRequireDetails(
            !isExistingUser ||
            !fetchedName ||
            fetchedName.trim() === '' ||
            !fetchedEmail ||
            fetchedEmail.trim() === ''
          );
        } else {
          setError(`Error: ${data.error || 'Invalid OTP'}`);
        }
      } else if (requireDetails) {
        if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError('Please enter a valid name and email');
          return;
        }
        setError('');
        setResponseMessage('');
        const phoneNumber = `+91${number}`;
        await saveUserDetails(phoneNumber, name, email);
        completeLogin(phoneNumber, name, email);
      }
    } catch (err) {
      console.error('handleSubmit error:', err.message, err.stack, 'at', new Date().toISOString());
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    console.log('handleContinue triggered, isVerified:', isVerified, 'requireDetails:', requireDetails);
    if (isVerified && !requireDetails) {
      const phoneNumber = `+91${number}`;
      const fetchedName = name || number; // Fallback to phone if no name
      const fetchedEmail = email || ''; // Fallback to empty if no email
      completeLogin(phoneNumber, fetchedName, fetchedEmail);
    }
  };

  return (
    <div className={`login-popup-container ${responseMessage === 'Login successful' ? 'success-popup-container' : ''}`}>
      <div className={`login-popup ${responseMessage === 'Login successful' ? 'success-popup' : ''}`} style={{ display: isModalOpen ? 'block' : 'none' }}>
        {responseMessage !== 'Login successful' && (
          <div className="login-title">
            <h3>{isVerified && requireDetails ? 'Enter Your Details' : otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
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
        ) : !isVerified ? (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={isLoading}
            />
          </div>
        ) : requireDetails ? (
          <div className="user-details" style={{ width: '70%', margin: 'auto', marginBottom: '20px' }}>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
            <div className="input-group mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : null}
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
              {isVerified && requireDetails ? 'Submit' : isVerified && !requireDetails ? 'CONTINUE' : otpSent ? 'VERIFY OTP' : 'SEND OTP'}
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

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

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) setNumber(storedPhone.replace('+91', ''));
  }, []);

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
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', phoneNumber);
    cxtDispatch({
      type: 'USER_LOGIN',
      payload: { isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }
    });
    console.log('completeLogin called with:', { phoneNumber, name, email });
    setResponseMessage('Login successful');
    setTimeout(onClose, 2000);
  };

  const Signup = async (event) => {
    event.preventDefault();
    console.log('Signup triggered, otpSent:', otpSent, 'isVerified:', isVerified, 'requireDetails:', requireDetails);

    if (!otpSent) {
      if (number.length !== 10 || !/^\d+$/.test(number)) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
      setError('');
      setResponseMessage('');
      setOtpInput('');
      const phoneNumber = `+91${number}`;
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber })
        });
        console.log('send-otp status:', response.status);
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
      } catch (err) {
        console.error('send-otp exception:', err);
        setError('Failed to connect to server');
      }
    } else if (!isVerified) {
      if (otpInput.length !== 6 || !/^\d+$/.test(otpInput)) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }
      setError('');
      setResponseMessage('');
      const phoneNumber = `+91${number}`;
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp: otpInput })
        });
        console.log('verify-otp status:', response.status);
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
          const fetchedName = data.user?.name || phoneNumber;
          const fetchedEmail = data.user?.email || '';
          const isExistingUser = data.isExistingUser || false;
          setName(fetchedName);
          setEmail(fetchedEmail);
          console.log('Setting name:', fetchedName, 'email:', fetchedEmail, 'isExistingUser:', isExistingUser);
          setRequireDetails(
            !isExistingUser ||
            !fetchedName ||
            fetchedName === phoneNumber ||
            fetchedName.trim() === '' ||
            !fetchedEmail ||
            fetchedEmail.trim() === ''
          );
          console.log('requireDetails set to:', !isExistingUser || !fetchedName || fetchedName === phoneNumber || fetchedName.trim() === '' || !fetchedEmail || fetchedEmail.trim() === '');
          if (!requireDetails) {
            completeLogin(phoneNumber, fetchedName, fetchedEmail);
          }
        } else {
          setError(`Error: ${data.error || 'Invalid OTP'}`);
        }
      } catch (err) {
        console.error('verify-otp exception:', err);
        setError('Failed to verify OTP');
      }
    } else if (requireDetails) {
      if (!name.trim() || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid name and email');
        return;
      }
      setError('');
      setResponseMessage('');
      const phoneNumber = `+91${number}`;
      try {
        await saveUserDetails(phoneNumber, name, email);
        completeLogin(phoneNumber, name, email);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className={`login-popup-container ${responseMessage === 'Login successful' ? 'success-popup-container' : ''}`}>
      <div className={`login-popup ${responseMessage === 'Login successful' ? 'success-popup' : ''}`}>
        <div className="login-title">
          <h3>{isVerified && requireDetails ? 'Enter Your Details' : otpSent ? 'Enter OTP to Login' : 'Please Enter Your Mobile Number'}</h3>
        </div>
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
                maxLength={10}
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
              maxLength={6}
            />
          </div>
        ) : requireDetails ? (
          <div className="user-details" style={{ width: '70%', margin: 'auto', marginBottom: '20px' }}>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <button type="submit" className="login-button" onClick={Signup}>
              {isVerified && !requireDetails ? 'CONTINUE' : isVerified && requireDetails ? 'SAVE & LOGIN' : otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          )}
        </div>
        {responseMessage && responseMessage !== 'Login successful' && (
          <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>
        )}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;

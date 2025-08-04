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

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) setNumber(storedPhone.replace('+91', ''));
  }, []);

  const fetchUserDetails = async (phoneNumber) => {
    try {
      const response = await fetch('https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', phone_number: phoneNumber })
      });
      const data = await response.json();
      if (response.ok) {
        setName(data.name || '');
        setEmail(data.email || '');
      } else {
        console.error('Error fetching user details:', data.error);
      }
    } catch (err) {
      console.error('Fetch user details error:', err);
    }
  };

  const saveUserDetails = async (phoneNumber, name, email) => {
    try {
      const response = await fetch('https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', phone_number: phoneNumber, name, email })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Error saving user details:', data.error);
      }
    } catch (err) {
      console.error('Save user details error:', err);
    }
  };

  const Signup = async (event) => {
    event.preventDefault();
    console.log('Signup triggered, otpSent:', otpSent, 'isVerified:', isVerified);

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
        const data = await response.json();
        console.log('Send OTP response:', data);
        if (response.ok) {
          setResponseMessage('OTP sent! Enter it below:');
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          localStorage.setItem('userPhone', phoneNumber);
          setOtpSent(true);
          await fetchUserDetails(phoneNumber); // Fetch name and email
        } else {
          setError(`Error: ${data.error || data.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Send OTP error:', err);
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
        const data = await response.json();
        console.log('Verify OTP raw response:', data);
        let body = data;
        if (data.body && typeof data.body === 'string') {
          body = JSON.parse(data.body);
        }
        if (response.status === 200) {
          setResponseMessage(body.message || 'OTP verified successfully');
          setIsVerified(true);
        } else {
          setError(`Error: ${body.error || 'Invalid OTP'}`);
        }
      } catch (err) {
        console.error('Verify OTP error:', err);
        setError('Failed to verify OTP');
      }
    } else {
      // Save updated name and email
      if (!name.trim() || !email.trim()) {
        setError('Please enter both name and email');
        return;
      }
      setError('');
      const phoneNumber = `+91${number}`;
      try {
        await saveUserDetails(phoneNumber, name, email);
        const token = localStorage.getItem('authToken') || 'temp-token'; // Use existing token or placeholder
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', phoneNumber);
        cxtDispatch({
          type: 'USER_LOGIN',
          payload: { isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }
        });
        setResponseMessage('Login successful');
        onClose();
      } catch (err) {
        console.error('Save user details error:', err);
        setError('Failed to save user details');
      }
    }
  };

  return (
    <div className="login-popup-container">
      <div className="login-popup">
        <div className="login-title">
          <h3>{isVerified ? 'Enter Your Details' : otpSent ? 'Enter OTP to Login' : 'Please Enter Your Mobile Number'}</h3>
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
        ) : (
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
        )}
        <div>
          <button type="submit" className="login-button" onClick={Signup}>
            {isVerified ? 'SAVE & LOGIN' : otpSent ? 'VERIFY OTP' : 'SEND OTP'}
          </button>
        </div>
        {responseMessage && <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;

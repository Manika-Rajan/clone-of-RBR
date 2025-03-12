import React, { useState, useContext } from 'react';
import './Login.css';
import { Store } from '../Store';

const Login = ({ sendOtp, setLogin, setVerify, onClose }) => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { totalPrice, name, phone, email, status } = state;
  const [number, setNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setResponseMessage('');
    setOtpInput('');

    const phoneNumber = `+91${number}`;
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        setResponseMessage('OTP sent! Enter it below:');
        cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
        setLogin(false);
        sendOtp(true);
        setVerify(false);
      } else {
        setError(`Error: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setResponseMessage('');
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: `+91${number}`, otp: otpInput }),
      });
      const data = await response.json();
      const body = JSON.parse(data.body);
      if (data.statusCode === 200) {
        setResponseMessage(body.message);
        setLogin(false);
        sendOtp(false);
        setVerify(true);
      } else {
        setError(`Error: ${body.error || 'Invalid OTP'}`);
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError('Failed to verify OTP');
    }
  };

  return (
    <div className="login-popup-container">
      <div className="login-popup">
        <button onClick={onClose} style={{ float: 'right', border: 'none', background: 'none', fontSize: '20px' }}>
          ×
        </button>
        <div className="login-title">
          <h3>Please Enter Your Mobile Number</h3>
        </div>
        <div className="login-paragraph">
          <p>We will send you a <strong>One Time Password</strong></p>
        </div>
        <form onSubmit={handleSendOtp}>
          <div className="login-phone-input" style={{ width: '90%', textAlign: 'center', margin: 'auto' }}>
            <div className="input-group mb-3" style={{ width: '20%', display: 'inline-block', marginRight: '10px' }}>
              <select className="form-select" aria-label="Default select example" style={{ width: '100%' }}>
                <option selected>+91</option>
                <option value="2">+11</option>
              </select>
            </div>
            <div className="input-group mb-3" style={{ width: '75%', display: 'inline-block' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Your 10 digit Mobile Number"
                style={{ width: '100%', textAlign: 'center' }} // Explicitly set full width
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <button type="submit" className="login-button">
              SEND OTP
            </button>
          </div>
        </form>
        {responseMessage && !responseMessage.includes('verified') && (
          <div>
            <div className="input-group mb-3" style={{ width: '50%', margin: '20px auto' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit OTP"
                style={{ width: '100%', textAlign: 'center' }} // Explicitly set full width
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
              />
            </div>
            <button onClick={handleVerifyOtp} className="login-button">
              Verify OTP
            </button>
          </div>
        )}
        {responseMessage && <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;

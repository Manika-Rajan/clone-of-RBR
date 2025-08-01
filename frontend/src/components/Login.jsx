import React, { useState, useEffect, useContext } from 'react';
import './Login.css';
import { Store } from '../Store';

const Login = ({ onClose }) => {
  const { state, dispatch: cxtDispatch } = useContext(Store);

  const [number, setNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) setNumber(storedPhone.replace('+91', ''));
  }, []);

  const Signup = async (event) => {
    event.preventDefault();
    console.log('Signup triggered, otpSent:', otpSent);

    if (!otpSent) {
      if (number.length !== 10 || !/^\d+$/.test(number)) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
      setError('');
      setResponseMessage('');
      setOtpInput('');

      const phoneNumber = `+91${number}`;
      console.log('Sending OTP to:', phoneNumber);
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber }),
        });
        const data = await response.json();
        console.log('Send OTP response:', data);
        if (response.ok) {
          setResponseMessage('OTP sent! Enter it below:');
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          localStorage.setItem('userPhone', phoneNumber);
          setOtpSent(true);
        } else {
          setError(`Error: ${data.error || data.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Send OTP error:', err);
        setError('Failed to connect to server');
      }
    } else {
      if (otpInput.length !== 6 || !/^\d+$/.test(otpInput)) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }
      setError('');
      setResponseMessage('');
      const phoneNumber = `+91${number}`;
      console.log('Verifying OTP for:', phoneNumber, 'with OTP:', otpInput);
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp: otpInput }),
        });
        const data = await response.json();
        console.log('Verify OTP raw response:', data);
        let body = data;
        if (data.body && typeof data.body === 'string') {
          body = JSON.parse(data.body);
        }
        if (response.status === 200) {
          setResponseMessage(body.message || 'Login successful');
          const token = body.token;
          const { userId, name, email } = body.user;
          if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPhone', phoneNumber);
            cxtDispatch({ type: 'USER_LOGIN', payload: { isLogin: true, userId, name, email, phone: phoneNumber } });
            onClose();
          } else {
            setError('No token received from server');
          }
        } else {
          setError(`Error: ${body.error || 'Invalid OTP'}`);
        }
      } catch (err) {
        console.error('Verify OTP error:', err);
        setError('Failed to verify OTP');
      }
    }
  };

  return (
    <div className="login-popup-container">
      <div className="login-popup">
        <div className="login-title">
          <h3>{otpSent ? 'Enter OTP to Login' : 'Please Enter Your Mobile Number'}</h3>
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
        ) : (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={6}
            />
          </div>
        )}
        <div>
          <button type="submit" className="login-button" onClick={Signup}>
            {otpSent ? 'VERIFY OTP' : 'SEND OTP'}
          </button>
        </div>
        {responseMessage && <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;

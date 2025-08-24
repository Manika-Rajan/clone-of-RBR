import React, { useState, useContext } from 'react';
import './Login.css';
import { Store } from '../Store';

const Login = ({ onSuccess }) => {
  const { dispatch: cxtDispatch } = useContext(Store);
  const [step, setStep] = useState("PHONE"); // PHONE → OTP → DETAILS
  const [number, setNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setError('');
    setResponseMessage('');
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
        setStep("OTP");
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const verifyOtp = async () => {
    setError('');
    setResponseMessage('');
    const phoneNumber = `+91${number}`;
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp: otpInput }),
      });
      const data = await response.json();
      const body = JSON.parse(data.body);
      if (data.statusCode === 200) {
        // Check if user exists
        if (body.isNewUser) {
          setStep("DETAILS");
        } else {
          // Existing user → go straight to success (payment)
          onSuccess(body.user);
        }
      } else {
        setError(body.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP');
    }
  };

  const submitDetails = async () => {
    try {
      // Save new user details to DB
      const phoneNumber = `+91${number}`;
      const response = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, name, email }),
      });
      if (response.ok) {
        onSuccess({ phone: phoneNumber, name, email });
      } else {
        setError('Failed to save user details');
      }
    } catch (err) {
      setError('Server error while saving details');
    }
  };

  return (
    <div className='login-popup-container'>
      <div className='login-popup' >
        
        {step === "PHONE" && (
          <>
            <h3>Please Enter Your Mobile Number</h3>
            <input 
              type="text" 
              placeholder="Enter 10 digit mobile" 
              value={number} 
              onChange={(e) => setNumber(e.target.value)} 
              maxLength={10} 
            />
            <button className='login-button' onClick={sendOtp}>SEND OTP</button>
          </>
        )}

        {step === "OTP" && (
          <>
            <h3>Enter OTP</h3>
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otpInput} 
              onChange={(e) => setOtpInput(e.target.value)} 
              maxLength={6} 
            />
            <button className='login-button' onClick={verifyOtp}>VERIFY OTP</button>
          </>
        )}

        {step === "DETAILS" && (
          <>
            <h3>Complete Your Profile</h3>
            <input 
              type="text" 
              placeholder="Enter Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
            <input 
              type="email" 
              placeholder="Enter Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <button className='login-button' onClick={submitDetails}>SUBMIT</button>
          </>
        )}

        {responseMessage && <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useContext } from 'react';
import { Store } from '../Store';

const Otp = ({ setVerify, sendOtp, setLogin, phone, setOpenModel }) => {
  const [otp, setOtp] = useState('');
  const { state, dispatch } = useContext(Store);
  const phoneNumber = state.phone;

  const handleVerification = async () => {
    console.log('🔵 Login button clicked');
    console.log('🔵 phone_number:', phoneNumber, 'otp:', otp);
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp }),
      });

      const data = await response.json();
      console.log('🟢 OTP verification response:', data);

      if (response.ok) {
        const parsedBody = JSON.parse(data.body); // extract message if needed
        alert('✅ Login successful!');

        // ✅ OTP verified — update global state
        dispatch({ type: 'USER_LOGIN', payload: true });
        dispatch({ type: 'SET_PHONE', payload: phone });
        dispatch({ type: 'SET_NAME', payload: phone }); // Optional placeholder

        // ✅ Update UI and close modal
        setOpenModel(false);
        setLogin(false);
        setVerify(true);    // Keep this true, used only for UI now
        sendOtp(false);
      } else {
        alert(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
    }
  };

  return (
    <div className='login-popup'>
      <div className='login-title' style={{ padding: '0 20px' }}>
        <h3>Please Enter the One Time Password to Login</h3>
      </div>
      <div className='login-paragraph'>
        <p>OTP has been sent to {phone}</p>
        <div className="otp-fields">
          <input
            className='otp-input'
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            placeholder="Enter 6-digit OTP"
          />
        </div>
      </div>
      <div>
        <button className='login-button' onClick={handleVerification}>LOGIN</button>
        <p style={{ color: '#0263C7', marginTop: '15px' }}>RESEND OTP</p>
        <p style={{ color: '#0263C7' }}>
          <a href='Login.jsx'>Entered a Wrong Mobile Number?</a>
        </p>
      </div>
    </div>
  );
};

export default Otp;

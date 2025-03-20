import React, { useState, useContext } from 'react';
import { Store } from '../Store';

const Otp = ({ setVerify, sendOtp, setLogin, phone }) => {
  const [otp, setOtp] = useState('');
  const { dispatch } = useContext(Store);

  const handleVerification = async () => {
      console.log('🔵 Login button clicked');
      console.log('🔵 Phone:', phone, 'OTP:', otp);
    try {
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, otp }),
      });

      const data = await response.json();
      console.log('🟢 OTP verification response:', data);

      if (response.ok) {
        // ✅ OTP verified — update global state
        dispatch({ type: 'USER_LOGIN', payload: true });
        dispatch({ type: 'SET_PHONE', payload: phone });
        dispatch({ type: 'SET_NAME', payload: phone }); // Optional placeholder for now

        // Hide OTP modal and update UI
        setLogin(false);
        setVerify(false);
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
          <input className='otp-input' type="text" value={otp} onChange={(e) => setOtp(e.target.value)} />
        </div>
      </div>
      <div>
        <button className='login-button' onClick={handleVerification}>LOGIN</button>
        <p style={{ color: '#0263C7', marginTop: '15px' }}>RESEND OTP</p>
        <p style={{ color: '#0263C7' }}><a href='Login.jsx'>Entered a Wrong Mobile Number?</a></p>
      </div>
    </div>
  );
};

export default Otp;

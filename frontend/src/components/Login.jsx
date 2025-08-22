import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { Store } from '../Store';

const Login = ({ onClose, onPhaseChange, openModel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const [loginState, setLoginState] = useState({ number: '', otpInput: '', name: '', email: '', responseMessage: '', error: '', otpSent: false, isLoading: false });
  const [isModalOpen, setIsModalOpen] = useState(openModel);
  const renderTrigger = useRef(0);

  useEffect(() => {
    setIsModalOpen(openModel);
    console.log("Login - isModalOpen updated to:", isModalOpen, "openModel:", openModel, "otpSent:", loginState.otpSent, "renderTrigger:", renderTrigger.current);
    renderTrigger.current += 1; // Track render count
  }, [openModel, loginState.otpSent]);

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone) {
      setLoginState(prev => ({ ...prev, number: storedPhone.replace('+91', '') }));
    }
  }, []);

  const forceUpdate = () => {
    renderTrigger.current += 1;
    console.log("Force update triggered, renderTrigger:", renderTrigger.current);
  };

  const completeLogin = (phoneNumber, name, email) => {
    localStorage.setItem('userInfo', JSON.stringify({ isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }));
    cxtDispatch({
      type: 'USER_LOGIN',
      payload: { isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }
    });
    console.log('completeLogin called with:', { phoneNumber, name, email });
    setLoginState(prev => ({ ...prev, responseMessage: 'Login successful', isLoading: false }));
    setTimeout(() => {
      if (onClose) {
        console.log('Calling onClose from completeLogin');
        onClose();
      }
      setIsModalOpen(false);
      navigate("/report-display", {
        state: { loggedIn: true, file_key: location.state?.file_key, reportId: location.state?.reportId, amount: location.state?.amount },
        replace: true,
      });
    }, 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginState(prev => ({ ...prev, isLoading: true }));
    console.log('handleSubmit triggered, otpSent:', loginState.otpSent);

    try {
      if (!loginState.otpSent) {
        if (loginState.number.length !== 10 || !/^\d+$/.test(loginState.number)) {
          setLoginState(prev => ({ ...prev, error: 'Please enter a valid 10-digit mobile number', isLoading: false }));
          return;
        }
        setLoginState(prev => ({ ...prev, error: '', responseMessage: '', otpInput: '' }));
        const phoneNumber = `+91${loginState.number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber })
        });
        console.log('send-otp status:', response.status, 'at', new Date().toISOString());
        const data = await response.json();
        console.log('send-otp response:', data);
        if (response.ok) {
          setLoginState(prev => ({ ...prev, responseMessage: 'OTP sent! Enter it below:' }));
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          localStorage.setItem('userPhone', phoneNumber);
          setLoginState(prev => ({ ...prev, otpSent: true })); // Update otpSent
          if (onPhaseChange) {
            console.log('Calling updateLoginPhase(1)');
            onPhaseChange(1); // Trigger phase change
          }
          forceUpdate(); // Force re-render
        } else {
          setLoginState(prev => ({ ...prev, error: `Error: ${data.error || data.message || 'Unknown error'}`, isLoading: false }));
        }
      } else {
        if (loginState.otpInput.length !== 6 || !/^\d+$/.test(loginState.otpInput)) {
          setLoginState(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP', isLoading: false }));
          return;
        }
        setLoginState(prev => ({ ...prev, error: '', responseMessage: '' }));
        const phoneNumber = `+91${loginState.number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp: loginState.otpInput })
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
          setLoginState(prev => ({ ...prev, responseMessage: 'OTP verified successfully' }));
          const fetchedName = data.user?.name || phoneNumber;
          const fetchedEmail = data.user?.email || '';
          completeLogin(phoneNumber, fetchedName, fetchedEmail);
        } else {
          setLoginState(prev => ({ ...prev, error: `Error: ${data.error || 'Invalid OTP'}`, isLoading: false }));
        }
      }
    } catch (err) {
      console.error('handleSubmit error:', err.message, err.stack, 'at', new Date().toISOString());
      setLoginState(prev => ({ ...prev, error: `An error occurred: ${err.message}`, isLoading: false }));
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !loginState.isLoading) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleChange = (field) => (event) => {
    setLoginState(prev => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className={`login-popup-container ${loginState.responseMessage === 'Login successful' ? 'success-popup-container' : ''}`}>
      <div className={`login-popup ${loginState.responseMessage === 'Login successful' ? 'success-popup' : ''}`} style={{ display: isModalOpen ? 'block' : 'none' }}>
        {loginState.responseMessage !== 'Login successful' && (
          <div className="login-title">
            <h3>{loginState.otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
          </div>
        )}
        <div className="login-paragraph">
          {!loginState.otpSent && <p>We will send you a <strong>One Time Password</strong></p>}
        </div>
        {!loginState.otpSent ? (
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
                value={loginState.number}
                onChange={handleChange('number')}
                onKeyPress={handleKeyPress}
                maxLength={10}
                disabled={loginState.isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={loginState.otpInput}
              onChange={handleChange('otpInput')}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={loginState.isLoading}
            />
          </div>
        )}
        <div>
          {loginState.responseMessage === 'Login successful' ? (
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
            <button type="submit" className="login-button" onClick={handleSubmit} disabled={loginState.isLoading}>
              {loginState.otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          )}
        </div>
        {loginState.responseMessage && loginState.responseMessage !== 'Login successful' && (
          <p style={{ color: 'green', textAlign: 'center' }}>{loginState.responseMessage}</p>
        )}
        {loginState.error && <p style={{ color: 'red', textAlign: 'center' }}>{loginState.error}</p>}
        {loginState.isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
};

export default Login;

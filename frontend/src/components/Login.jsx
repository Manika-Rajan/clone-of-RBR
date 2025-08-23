import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { Store } from '../Store';

const Login = React.memo(({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const renderTrigger = useRef(0);
  const componentId = useRef(Date.now().toString());

  useEffect(() => {
    setIsModalOpen(true);
    console.log(`Login [ID: ${componentId.current}] - isModalOpen updated to:`, isModalOpen, "state:", state, "renderTrigger:", renderTrigger.current);
    renderTrigger.current += 1;
  }, [state.loginPhase]);

  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhone');
    if (storedPhone && !state.loginState.number) {
      cxtDispatch({ type: 'UPDATE_LOGIN_FIELD', field: 'number', value: storedPhone.replace('+91', '') });
    }
  }, [state.loginState.number]);

  useEffect(() => {
    console.log(`Effect checking [ID: ${componentId.current}] - updateTrigger:`, state.loginState.updateTrigger, 'otpSent:', state.loginState.otpSent);
    if (state.loginState.updateTrigger > 0 && state.loginState.otpSent) {
      console.log(`Effect triggered [ID: ${componentId.current}] - updateTrigger:`, state.loginState.updateTrigger, 'otpSent:', state.loginState.otpSent);
      forceUpdate();
    }
  }, [state.loginState.updateTrigger, state.loginState.otpSent]);

  const forceUpdate = useCallback(() => {
    renderTrigger.current += 1;
    console.log(`Force update triggered [ID: ${componentId.current}], renderTrigger:`, renderTrigger.current);
  }, []);

  const completeLogin = (phoneNumber, name, email) => {
    localStorage.setItem('userInfo', JSON.stringify({ isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }));
    cxtDispatch({
      type: 'USER_LOGIN',
      payload: { isLogin: true, userId: phoneNumber, name, email, phone: phoneNumber }
    });
    console.log('completeLogin called with:', { phoneNumber, name, email });
    cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { responseMessage: 'Login successful', isLoading: false } });
    if (onClose) {
      console.log('Calling onClose from completeLogin');
      onClose();
    }
    setIsModalOpen(false);
    navigate("/report-display", {
      state: { loggedIn: true, fileKey: location.state?.fileKey, reportId: location.state?.reportId, amount: location.state?.amount },
      replace: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { isLoading: true } });
    console.log(`handleSubmit [ID: ${componentId.current}] triggered, otpSent:`, state.loginState.otpSent);

    try {
      if (!state.loginState.otpSent) {
        if (state.loginState.number.length !== 10 || !/^\d+$/.test(state.loginState.number)) {
          cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: 'Please enter a valid 10-digit mobile number', isLoading: false } });
          return;
        }
        cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: '', responseMessage: '', otpInput: '', otpSent: true, updateTrigger: state.loginState.updateTrigger + 1 } });
        console.log(`State updated to otpSent: true Update trigger set to: ${state.loginState.updateTrigger + 1} [ID: ${componentId.current}]`);
        const phoneNumber = `+91${state.loginState.number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber })
        });
        console.log('send-otp status:', response.status, 'at', new Date().toISOString());
        const data = await response.json();
        console.log('send-otp response:', data);
        if (response.ok) {
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          localStorage.setItem('userPhone', phoneNumber);
        } else {
          cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: `Error: ${data.error || data.message || 'Unknown error'}`, isLoading: false, otpSent: false, updateTrigger: 0 } });
        }
      } else {
        if (state.loginState.otpInput.length !== 6 || !/^\d+$/.test(state.loginState.otpInput)) {
          cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: 'Please enter a valid 6-digit OTP', isLoading: false } });
          return;
        }
        cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: '', responseMessage: '' } });
        const phoneNumber = `+91${state.loginState.number}`;
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp: state.loginState.otpInput })
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
          cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { responseMessage: 'OTP verified successfully' } });
          const fetchedName = data.user?.name || phoneNumber;
          const fetchedEmail = data.user?.email || '';
          completeLogin(phoneNumber, fetchedName, fetchedEmail);
        } else {
          cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: `Error: ${data.error || 'Invalid OTP'}`, isLoading: false } });
        }
      }
    } catch (err) {
      console.error('handleSubmit error:', err.message, err.stack, 'at', new Date().toISOString());
      cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { error: `An error occurred: ${err.message}`, isLoading: false } });
    } finally {
      cxtDispatch({ type: 'SET_LOGIN_STATE', payload: { isLoading: false } });
    }
  };

  const handleChange = (field) => (event) => {
    event.preventDefault();
    cxtDispatch({ type: 'UPDATE_LOGIN_FIELD', field, value: event.target.value });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !state.loginState.isLoading) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className={`login-popup-container ${state.loginState.responseMessage === 'Login successful' ? 'success-popup-container' : ''}`}>
      <div className={`login-popup ${state.loginState.responseMessage === 'Login successful' ? 'success-popup' : ''}`} style={{ display: isModalOpen ? 'block' : 'none' }}>
        {state.loginState.responseMessage !== 'Login successful' && (
          <div className="login-title">
            <h3>{state.loginState.otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
          </div>
        )}
        <div className="login-paragraph">
          {!state.loginState.otpSent && <p>We will send you a <strong>One Time Password</strong></p>}
        </div>
        {!state.loginState.otpSent ? (
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
                value={state.loginState.number}
                onChange={handleChange('number')}
                onKeyPress={handleKeyPress}
                maxLength={10}
                disabled={state.loginState.isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={state.loginState.otpInput}
              onChange={handleChange('otpInput')}
              onKeyPress={handleKeyPress}
              maxLength={6}
              disabled={state.loginState.isLoading}
            />
          </div>
        )}
        <div>
          {state.loginState.responseMessage === 'Login successful' ? (
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
            <button onClick={handleSubmit} className="login-button" disabled={state.loginState.isLoading}>
              {state.loginState.otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          )}
        </div>
        {state.loginState.responseMessage && state.loginState.responseMessage !== 'Login successful' && (
          <p style={{ color: 'green', textAlign: 'center' }}>{state.loginState.responseMessage}</p>
        )}
        {state.loginState.error && <p className="error-message">{state.loginState.error}</p>}
        {state.loginState.isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
});

export default Login;

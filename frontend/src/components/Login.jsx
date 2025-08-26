import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { useStore } from '../Store';

const Login = React.memo(({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [phone, setPhone] = useState(
    state.phone ? state.phone.replace('+91', '') : ''
  );
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    setIsModalOpen(true);
  }, [returnTo]);

  // ✅ Autofocus input when step changes
  useEffect(() => {
    if (!otpSent && phoneInputRef.current) {
      phoneInputRef.current.focus();
    } else if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent, isModalOpen]);

  const sendOtp = async () => {
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
        setOtpSent(true);
      } else {
        setError(`Error: ${data.error || 'Failed to send OTP'}`);
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp }),
        }
      );
      const data = await response.json();

      if (response.status === 200) {
        // ✅ Step 1: Dispatch minimal login info
        const baseUser = {
          isLogin: true,
          userId: phoneNumber,
          phone: phoneNumber,
        };
        cxtDispatch({ type: 'USER_LOGIN', payload: baseUser });
        localStorage.setItem('userInfo', JSON.stringify(baseUser));

        // ✅ Step 2: Immediately fetch full profile from DynamoDB
        try {
          const profileRes = await fetch(
            'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'get', phone_number: phoneNumber }),
            }
          );

          const profileData = await profileRes.json();
          let userProfile = profileData;

          // 🔧 Fix: parse nested body JSON if exists
          if (profileData.body) {
            try {
              userProfile = JSON.parse(profileData.body);
            } catch (e) {
              console.error("Failed to parse profile body:", profileData.body);
            }
          }

          const enrichedUser = {
            ...baseUser,
            name: userProfile.name || "User Name",
            email: userProfile.email || '',
            photo_url: userProfile.photo_url || null,
          };

          cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
          localStorage.setItem('userInfo', JSON.stringify(enrichedUser));
        } catch (profileErr) {
          console.error("Profile fetch failed:", profileErr);
          // ✅ fallback to safe default
          const fallbackUser = { ...baseUser, name: "User Name", email: '', photo_url: null };
          cxtDispatch({ type: 'USER_LOGIN', payload: fallbackUser });
          localStorage.setItem('userInfo', JSON.stringify(fallbackUser));
        }

        if (onClose) onClose();
        setIsModalOpen(false);

        // ✅ Conditional redirect logic
        let redirectTo = '/'; // default → landing page
        if (returnTo) {
          redirectTo = returnTo;
        } else if (location.pathname.includes('/report-display')) {
          redirectTo = '/report-display';
        }

        navigate(redirectTo, { replace: true });
      } else {
        setError(`Error: ${data.error || 'Invalid OTP'}`);
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) sendOtp();
    else verifyOtp();
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  return (
    <div className="login-popup-container">
      <div
        className="login-popup"
        style={{ display: isModalOpen ? 'block' : 'none' }}
      >
        {!isLoading && !error && (
          <div className="login-title">
            <h3>{otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
          </div>
        )}
        <div className="login-paragraph">
          {!otpSent && (
            <p>
              We will send you a <strong>One Time Password</strong>
            </p>
          )}
        </div>

        {/* ✅ Form handles Enter key */}
        <form onSubmit={handleSubmit}>
          {!otpSent ? (
            <div
              className="login-phone-input d-flex justify-content-center align-items-center gap-2"
              style={{ width: '80%', margin: 'auto' }}
            >
              <select
                className="form-select w-auto"
                aria-label="Country code"
                disabled
              >
                <option defaultValue>+91</option>
              </select>
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter Your 10 digit Mobile Number"
                value={phone}
                onChange={handleChange(setPhone)}
                maxLength={10}
                disabled={isLoading}
                ref={phoneInputRef}
              />
            </div>
          ) : (
            <div className="otp-fields d-flex justify-content-center mt-3">
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleChange(setOtp)}
                maxLength={6}
                disabled={isLoading}
                ref={otpInputRef}
              />
            </div>
          )}

          <div className="text-center mt-3">
            <button
              type="submit"
              className="btn btn-primary w-50"
              disabled={isLoading}
            >
              {otpSent ? 'VERIFY OTP' : 'SEND OTP'}
            </button>
          </div>
        </form>

        {error && <p className="error-message text-danger mt-2">{error}</p>}
        {isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
});

export default Login;

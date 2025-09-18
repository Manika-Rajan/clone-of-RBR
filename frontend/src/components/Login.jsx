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

  // 🔹 New states for profile completion
  const [needsProfile, setNeedsProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setIsModalOpen(true);
  }, [returnTo]);

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
      console.log('verify-otp response:', data);

      if (response.status === 200) {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data.body);
        } catch (e) {
          console.error('Failed to parse verify-otp body:', data.body);
          setError('Authentication failed: Invalid response format');
          setIsLoading(false);
          return;
        }

        const { token } = parsedBody;
        if (!token) {
          console.error('No token in parsed body:', parsedBody);
          setError('Authentication failed: No token received');
          setIsLoading(false);
          return;
        }

        // Step 1: base user
        const baseUser = {
          isLogin: true,
          userId: phoneNumber,
          phone: phoneNumber,
          token,
        };
        cxtDispatch({ type: 'USER_LOGIN', payload: baseUser });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(baseUser));

        // Step 2: fetch profile
        try {
          const profileRes = await fetch(
            'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ action: 'get', phone_number: phoneNumber }),
            }
          );
          const profileData = await profileRes.json();
          console.log('manage-user-profile response:', profileData);

          let userProfile = profileData;
          if (profileData.body) {
            try {
              userProfile = JSON.parse(profileData.body);
            } catch (e) {
              console.error('Failed to parse profile body:', profileData.body);
            }
          }

          // 🔹 If name/email missing → show profile form
          if (!userProfile.name || !userProfile.email) {
            setNeedsProfile(true);
            setName(userProfile.name || '');
            setEmail(userProfile.email || '');
            setIsLoading(false);
            return;
          }

          const enrichedUser = {
            ...baseUser,
            name: userProfile.name,
            email: userProfile.email,
            photo_url: userProfile.photo_url || null,
            token,
            role: userProfile.role || 'user',
          };
          cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
          localStorage.setItem('authToken', token);
          localStorage.setItem('userInfo', JSON.stringify(enrichedUser));

          if (onClose) onClose();
          setIsModalOpen(false);

          let redirectTo = '/';
          if (returnTo === '/payment' || location.pathname.includes('/report-display')) {
            redirectTo = '/payment';
          }
          navigate(redirectTo, {
            replace: true,
            state: {
              fileKey: location.state?.fileKey || state.fileKey,
              reportId: location.state?.reportId || state.reportId,
            },
          });
        } catch (profileErr) {
          console.error('Profile fetch failed:', profileErr);
        }
      } else {
        setError(`Error: ${data.error || 'Invalid OTP'}`);
      }
    } catch (err) {
      console.error('verifyOtp error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const phoneNumber = `+91${phone}`;
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'update',
            phone_number: phoneNumber,
            name,
            email,
          }),
        }
      );

      if (response.ok) {
        const profileRes = await fetch(
          'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'get', phone_number: phoneNumber }),
          }
        );
        const profileData = await profileRes.json();
        const finalProfile = profileData.body
          ? JSON.parse(profileData.body)
          : profileData;

        const enrichedUser = {
          isLogin: true,
          userId: phoneNumber,
          phone: phoneNumber,
          token,
          name: finalProfile.name,
          email: finalProfile.email,
          photo_url: finalProfile.photo_url || null,
          role: finalProfile.role || 'user',
        };

        cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(enrichedUser));

        if (onClose) onClose();
        setIsModalOpen(false);
        navigate('/');
      } else {
        setError('Failed to save profile');
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setError('An error occurred while saving profile');
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
        {!isLoading && !error && !needsProfile && (
          <div className="login-title">
            <h3>{otpSent ? 'Verify OTP' : 'Please Enter Your Mobile Number'}</h3>
          </div>
        )}

        {!needsProfile && (
          <>
            <div className="login-paragraph">
              {!otpSent && (
                <p>
                  We will send you a <strong>One Time Password</strong>
                </p>
              )}
            </div>
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
          </>
        )}

        {needsProfile && (
          <div className="profile-completion-form text-center mt-3">
            <h4>Complete Your Profile</h4>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              className="form-control mb-2"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-success w-50" onClick={saveProfile}>
              Save Profile
            </button>
          </div>
        )}

        {error && <p className="error-message text-danger mt-2">{error}</p>}
        {isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
});

export default Login;

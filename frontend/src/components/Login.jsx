import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import './Login.css';
import { Store } from '../Store';
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import OtpInput from 'react-otp-input';

const Login = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Use hook for location
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;

  const [phone, setPhone] = useState(userInfo.phone || ''); // Default to userInfo.phone or empty
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [requireDetails, setRequireDetails] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("useEffect triggered, calling handleContinue");
    if (isVerified && !requireDetails) handleContinue();
  }, [isVerified, requireDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered, otpSent:", otpSent, "isVerified:", isVerified, "requireDetails:", requireDetails);
    setLoading(true);
    setError('');

    try {
      if (!otpSent) {
        const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/send-otp-RBRmain-APIgateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        console.log("send-otp status:", response.status, "at", new Date().toISOString());
        const data = await response.json();
        console.log("send-otp response:", data);
        if (response.ok) {
          setOtpSent(true);
        } else {
          setError(data.message || 'Failed to send OTP');
        }
      } else {
        const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/verify-otp-RBRmain-APIgateway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp }),
        });
        console.log("verify-otp status:", response.status, "at", new Date().toISOString());
        const rawResponse = await response.text();
        console.log("verify-otp raw response:", rawResponse);
        const data = JSON.parse(rawResponse);
        console.log("verify-otp parsed data:", data);
        if (response.ok) {
          setIsVerified(true);
          if (!data.name || !data.email) {
            setRequireDetails(true);
          }
        } else {
          setError(data.message || 'Invalid OTP');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    console.log("handleContinue triggered, isVerified:", isVerified, "requireDetails:", requireDetails);
    if (isVerified && !requireDetails) {
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: phone }),
      });
      const data = await response.json();
      completeLogin(data);
    }
  };

  const completeLogin = async (data) => {
    console.log("completeLogin called with:", data);
    const userInfo = {
      isLogin: true,
      userId: data.userId || phone, // Use phone as fallback
      name: data.name,
      email: data.email,
      phone: phone,
    };
    cxtDispatch({ type: 'USER_LOGIN', payload: userInfo });
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    if (onClose) {
      console.log("Calling onClose from completeLogin with loggedIn: true");
      onClose(true); // Close modal and signal login success
      // Navigate back to ReportsDisplay with updated state
      navigate("/report-display", {
        state: { 
          loggedIn: true, 
          file_key: location.state?.file_key, 
          reportId: location.state?.reportId, 
          amount: location.state?.amount 
        },
        replace: true,
      });
    }
  };

  return (
    <div>
      <Modal isOpen={true} toggle={onClose} style={{ maxWidth: '650px', width: '100%', marginTop: "15%" }} size="lg">
        <ModalHeader toggle={onClose}>Login</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            {!otpSent && !isVerified && (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            )}
            {otpSent && !isVerified && (
              <>
                <div className="form-group">
                  <label>Enter OTP</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderInput={(props) => <input {...props} />}
                    inputStyle={{
                      width: '40px',
                      height: '40px',
                      margin: '0 5px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                    shouldAutoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </>
            )}
            {requireDetails && isVerified && (
              <>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" />
                </div>
                <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
                  Submit Details
                </button>
              </>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default Login;

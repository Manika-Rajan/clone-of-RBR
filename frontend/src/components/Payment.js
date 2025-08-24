import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentGateway.css';
import Personal from '../assets/Personal.svg';
import Delivery from '../assets/Delivery.svg';
import pencil from '../assets/pencil.svg';
import green from '../assets/green-tick.svg';

const Payment = () => {
  // Pull userInfo and report from state
  const {
    state: { userInfo, report },
    dispatch: cxtDispatch,
  } = useContext(Store);

  const storeFileKey = report?.fileKey || '';
  const storeReportId = report?.reportId || '';

  const { isLogin, userId } = userInfo || {};

  const navigate = useNavigate();
  const location = useLocation();

  // ---- Helpers to resolve values safely from multiple sources ----
  const stateObj = location?.state || {};

  const resolvedReportId =
    stateObj.reportId ||
    stateObj.report_id ||
    storeReportId ||
    localStorage.getItem('reportId') ||
    localStorage.getItem('lastReportId') || // optional extra fallback
    '';

  const resolvedAmount =
    stateObj.amount ??
    (localStorage.getItem('amount')
      ? Number(localStorage.getItem('amount'))
      : undefined) ??
    400; // default ₹400 fallback

  const resolvedFileKey =
    stateObj.fileKey ||
    stateObj.file_key ||
    storeFileKey ||
    localStorage.getItem('fileKey') ||
    '';

  // Prefer values from userInfo, fallback to localStorage
  const storedName = localStorage.getItem('userName') || (userInfo?.name ?? '');
  const storedPhone =
    localStorage.getItem('userPhone') || (userInfo?.phone ?? userId);
  const storedEmail = localStorage.getItem('userEmail') || (userInfo?.email ?? '');

  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [inputName, setInputName] = useState(storedName);
  const [inputEmail, setInputEmail] = useState(storedEmail);
  const [verify, setVerify] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Local reactive copies for logging & validation
  const reportId = resolvedReportId;
  const amount = resolvedAmount;
  const file_key = resolvedFileKey;

  // Persist payment context so refresh doesn't lose it (and optionally into store if you add actions later)
  useEffect(() => {
    // Mirror to localStorage
    if (reportId) {
      localStorage.setItem('reportId', reportId);
      localStorage.setItem('lastReportId', reportId);
    }
    if (file_key) localStorage.setItem('fileKey', file_key);
    if (amount != null) localStorage.setItem('amount', String(amount));

    // Optional: dispatch to store (no-op if your reducer doesn't implement these types)
    try {
      if (reportId) cxtDispatch({ type: 'SET_REPORT_ID', payload: reportId });
      if (file_key) cxtDispatch({ type: 'SET_FILE_KEY', payload: file_key });
    } catch {
      // Safe to ignore if your reducer doesn't handle these yet
    }
  }, [reportId, file_key, amount, cxtDispatch]);

  useEffect(() => {
    console.log('Payment.js - Initial state:', {
      isLogin,
      userId,
      reportId,
      amount,
      file_key,
      locationState: location?.state,
    });

    if (!isLogin) {
      navigate('/');
      return;
    }

    let scriptLoaded = false;
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        scriptLoaded = true;
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please try again later.');
        scriptLoaded = false;
      };
      document.body.appendChild(script);

      setTimeout(() => {
        if (!scriptLoaded) {
          console.error('Razorpay script timeout');
          setError('Payment gateway timed out. Please refresh.');
        }
      }, 5000);
    } catch (e) {
      console.error('Error loading Razorpay script:', e.message);
      setError('Error initializing payment gateway.');
    }

    return () => {
      const script = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (script) document.body.removeChild(script);
    };
  }, [isLogin, userId, navigate, location?.state]);

  const saveUserDetails = async () => {
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            phone_number: storedPhone,
            name: inputName,
            email: inputEmail,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving user details:', errorData.error || 'Unknown error');
      } else {
        console.log('User details saved successfully');
      }
    } catch (err) {
      console.error('Save user details error:', err);
    }
  };

  const handleName = (e) => {
    if (e.key === 'Enter') {
      if (!inputName.trim()) {
        setError('Name cannot be empty');
        return;
      }
      cxtDispatch({ type: 'SET_NAME', payload: inputName });
      localStorage.setItem('userName', inputName);
      saveUserDetails();
      setEditName(false);
    }
  };

  const handleEmail = (e) => {
    if (e.key === 'Enter') {
      if (!inputEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
        setError('Please enter a valid email');
        return;
      }
      cxtDispatch({ type: 'SET_EMAIL', payload: inputEmail });
      localStorage.setItem('userEmail', inputEmail);
      saveUserDetails();
      setEditEmail(false);
      setSuccess(true);
    }
  };

  const handlePayment = async () => {
    setError('');
    setLoading(true);
    console.log('handlePayment called', {
      reportId,
      amount,
      file_key,
      userId,
      inputName,
      inputEmail,
      verify,
    });

    // Validate user input & context
    if (!reportId) {
      setError('Missing report reference. Please go back and re-open payment.');
      setLoading(false);
      return;
    }
    if (
      !userId ||
      !amount ||
      !inputName.trim() ||
      !inputEmail.trim() ||
      !verify
    ) {
      setError('Please fill all fields and agree to terms');
      setLoading(false);
      return;
    }

    // Confirm Razorpay library is present
    if (!window.Razorpay) {
      console.error('window.Razorpay is not available');
      setError('Payment gateway not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in again');
        navigate('/');
        setLoading(false);
        return;
      }

      console.log('Fetching create-razorpay-order…');
      const response = await fetch(
        'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/create-razorpay-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportId,
            amount: Math.round(Number(amount) * 100),
            userId,
          }),
        }
      );

      console.log('create-razorpay-order response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create order: ${errorText}`);
      }

      const order = await response.json();
      console.log('Razorpay order response:', order);

      // Robust key resolution: build-time env → window._env_ → localStorage override
      const razorpayKey =
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        (typeof window !== 'undefined' && window._env_?.RAZORPAY_KEY_ID) ||
        localStorage.getItem('razorpayKey');

      if (!razorpayKey) {
        console.error('Razorpay key is missing/undefined at runtime.');
        setError('Razorpay key not configured. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Opening Razorpay popup with order:', order?.id);

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: 'INR',
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: `Purchase of report ${reportId}`,
        image: '/logo.svg',
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('Verifying payment with:', {
              reportId,
              userId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            const verifyResponse = await fetch(
              'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  // The next 2 headers are not necessary for simple POSTs; kept if your API expects them.
                  'Access-Control-Request-Method': 'POST',
                  'Access-Control-Request-Headers': 'Content-Type,Authorization',
                },
                body: JSON.stringify({
                  reportId,
                  userId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            console.log('verify-payment response status:', verifyResponse.status);
            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.text();
              throw new Error(
                `Verification failed: ${verifyError || 'Unknown server error'}`
              );
            }
            const verifyData = await verifyResponse.json();
            console.log('Payment verification response:', verifyData);

            // Log outcome for your backend
            await fetch(
              'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/log_payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  reportId,
                  file_key,
                  userId,
                  status: 'success',
                  amount: Math.round(Number(amount) * 100),
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  timestamp: new Date().toISOString(),
                }),
              }
            );

            await saveUserDetails();
            navigate('/profile', { state: { showSuccess: true } });
          } catch (err) {
            console.error('Payment verification error:', err.message, err.stack);
            setError(`Payment verification failed: ${err.message}`);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: inputName,
          email: inputEmail,
          contact: storedPhone,
        },
        notes: {
          file_key,
          reportId, // helpful to have in Razorpay dashboard
          address: 'Rajan Business Ideas Office',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        console.error('Payment failed:', response?.error?.description);
        setError(`Payment failed: ${response?.error?.description || 'Unknown'}`);
        await fetch(
          'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/log_payment',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              reportId,
              file_key,
              userId,
              status: 'failed',
              amount: Math.round(Number(amount) * 100),
              razorpayPaymentId: response?.error?.metadata?.payment_id || null,
              razorpayOrderId: order.id,
              razorpaySignature: null,
              timestamp: new Date().toISOString(),
            }),
          }
        );
        setLoading(false);
      });

      // Open the Razorpay popup
      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error.message, error.stack);
      setError(`Failed to initiate payment: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="payments-page" style={{ position: 'relative', zIndex: 1000 }}>
      {/* Left Section */}
      <div className="payments-left">
        <div className="row" style={{ textAlign: 'center' }}>
          <img
            src={Personal}
            alt="Personal"
            style={{ width: '187px', height: '36px', marginLeft: '15%' }}
          />
        </div>

        {/* Name */}
        <div className="payment-name mt-2">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>Name:</label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            {editName ? (
              <input
                id="nameInput"
                className="edit-input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '1px solid #0263c7',
                  width: '90%',
                }}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={handleName}
              />
            ) : (
              <p style={{ fontSize: '20px', fontWeight: '400' }}>{inputName}</p>
            )}
          </div>
          <div>
            <img
              src={pencil}
              alt="Edit name"
              onClick={() => setEditName(!editName)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="payment-name mt-2">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>
              Phone Number:
            </label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            <p style={{ fontSize: '20px', fontWeight: '400' }}>{storedPhone}</p>
          </div>
        </div>

        <div className="row mt-2" style={{ textAlign: 'center' }}>
          <img
            src={Delivery}
            alt="Delivery"
            style={{ width: '187px', height: '36px', marginLeft: '15%' }}
          />
        </div>

        {/* Email */}
        <div className="payment-name mt-3">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>Email:</label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            {editEmail ? (
              <input
                id="emailInput"
                className="edit-input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '1px solid #0263c7',
                  width: '90%',
                }}
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                onKeyDown={handleEmail}
              />
            ) : (
              <p style={{ fontSize: '20px', fontWeight: '400' }}>{inputEmail}</p>
            )}
          </div>
          <div>
            <img
              src={pencil}
              alt="Edit email"
              onClick={() => setEditEmail(!editEmail)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        {success && (
          <div
            className="success-message"
            style={{
              marginLeft: '20%',
              marginTop: '5%',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div>
              <img src={green} alt="Success" />
            </div>
            <div>Your email id has been changed successfully</div>
          </div>
        )}

        <div className="form-check" style={{ paddingLeft: '25%', paddingTop: '5%' }}>
          <input
            className="form-check-input"
            type="checkbox"
            id="verify"
            checked={verify}
            onChange={(e) => setVerify(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="verify">
            <p className="text-secondary">
              I agree to all terms{' '}
              <span className="text-primary">Terms & Conditions</span>
            </p>
          </label>
        </div>
      </div>

      {/* Right Section */}
      <div className="payments-right">
        <div className="row">
          <p className="pay-price">Total Price: ₹{amount || 0}</p>
        </div>
        <div className="row">
          <button
            type="button"
            onClick={handlePayment}
            className="pay-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
        {error && (
          <div className="row">
            <p className="error-message">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;

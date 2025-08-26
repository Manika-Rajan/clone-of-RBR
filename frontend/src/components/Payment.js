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

  const ensureRazorpayLoaded = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        console.log('Razorpay SDK already loaded');
        return resolve(true);
      }
      console.log('Loading Razorpay SDK...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Razorpay SDK failed to load');
        reject(new Error('Razorpay SDK failed to load'));
      };
      document.body.appendChild(script);
      setTimeout(() => {
        if (!window.Razorpay) {
          console.error('Razorpay SDK load timeout');
          reject(new Error('Razorpay SDK load timeout'));
        }
      }, 10000); // Increased timeout to 10 seconds
    });

  const handlePayment = async () => {
    console.log('handlePayment started', {
      reportId,
      amount,
      file_key,
      userId,
      inputName,
      inputEmail,
      verify,
      authToken: localStorage.getItem('authToken'),
      userInfoToken: userInfo?.token, // Check if token exists in userInfo
    });

    setError('');
    setLoading(true);

    // Step 1: Validate inputs individually
    if (!reportId) {
      console.error('Validation failed: Missing reportId');
      setError('Missing report reference. Please select a report.');
      setLoading(false);
      return;
    }
    if (!userId) {
      console.error('Validation failed: Missing userId');
      setError('Please log in again.');
      navigate('/login'); // Changed to /login for clarity
      setLoading(false);
      return;
    }
    if (!inputName.trim()) {
      console.error('Validation failed: Missing name');
      setError('Please enter your name.');
      setLoading(false);
      return;
    }
    if (!inputEmail.trim()) {
      console.error('Validation failed: Missing email');
      setError('Please enter your email.');
      setLoading(false);
      return;
    }
    if (!verify) {
      console.error('Validation failed: Terms not accepted');
      setError('Please agree to the terms and conditions.');
      setLoading(false);
      return;
    }
    if (!amount || isNaN(amount)) {
      console.error('Validation failed: Invalid amount', { amount });
      setError('Invalid payment amount.');
      setLoading(false);
      return;
    }

    // Step 2: Ensure Razorpay SDK is loaded
    try {
      await ensureRazorpayLoaded();
      console.log('Razorpay SDK confirmed:', !!window.Razorpay);
    } catch (e) {
      console.error('Razorpay SDK error:', e.message);
      setError('Failed to load payment gateway. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Step 3: Fetch Razorpay order
    try {
      // Check authToken in localStorage and userInfo
      const token = localStorage.getItem('authToken') || userInfo?.token;
      if (!token) {
        console.error('No auth token found in localStorage or userInfo');
        setError('Authentication error. Please log in again and retry.');
        navigate('/login'); // Changed to /login for clarity
        setLoading(false);
        return;
      }

      console.log('Fetching create-razorpay-order with:', {
        reportId,
        amount: Math.round(Number(amount) * 100),
        userId,
        tokenSource: localStorage.getItem('authToken') ? 'localStorage' : 'userInfo',
      });
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
        console.error('create-razorpay-order error:', errorText);
        setError(`Failed to initiate payment: ${errorText || 'Server error'}`);
        setLoading(false);
        return;
      }

      const order = await response.json();
      console.log('Razorpay order response:', order);

      // Step 4: Resolve order details
      const orderId =
        order?.id ||
        order?.order_id ||
        order?.data?.id ||
        order?.data?.order_id;
      const orderAmount =
        order?.amount ||
        order?.data?.amount ||
        Math.round(Number(amount) * 100);
      const orderCurrency =
        order?.currency ||
        order?.data?.currency ||
        'INR';
      const keyFromOrder =
        order?.key ||
        order?.key_id ||
        order?.data?.key ||
        order?.data?.key_id ||
        null;

      const razorpayKey =
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        (typeof window !== 'undefined' && window._env_?.RAZORPAY_KEY_ID) ||
        localStorage.getItem('razorpayKey') ||
        keyFromOrder;

      console.log('Resolved Razorpay key:', razorpayKey, 'Order ID:', orderId);
      if (!razorpayKey) {
        console.error('Razorpay key missing');
        setError('Payment configuration error. Please contact support.');
        setLoading(false);
        return;
      }
      if (!orderId) {
        console.error('Order ID missing in response:', order);
        setError('Payment could not be initialized. Please retry.');
        setLoading(false);
        return;
      }

      console.log('Opening Razorpay popup with order:', orderId);

      // Step 5: Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: buildings,
        currency: orderCurrency,
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: `Purchase of report ${reportId}`,
        image: '/logo.svg',
        order_id: orderId,
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
          reportId,
          address: 'Rajan Business Ideas Office',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal closed by user');
            setError('Payment cancelled. Please try again.');
            setLoading(false);
          },
        },
      };

      console.log('Razorpay options:', options);

      // Step 6: Open Razorpay modal
      try {
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
                razorpayOrderId: orderId,
                razorpaySignature: null,
                timestamp: new Date().toISOString(),
              }),
            }
          );
          setLoading(false);
        });

        console.log('Opening Razorpay modal');
        rzp.open();
      } catch (err) {
        console.error('Razorpay initialization error:', err.message);
        setError(`Failed to open payment gateway: ${err.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment initiation error:', error.message, error.stack); // Fixed: Changed err.stack to error.stack
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

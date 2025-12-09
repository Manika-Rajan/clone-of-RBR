import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentMobile.css';
import Personal from '../assets/Personal.svg';
import Delivery from '../assets/Delivery.svg';
import pencil from '../assets/pencil.svg';
import green from '../assets/green-tick.svg';

const CONVERSION_SEND_TO = 'AW-824378442/NWTVCJbO_bobEMqIjIkD'; // Google Ads ID/Label

// Fire Google Ads conversion safely (once per paymentId)
function fireGoogleAdsPurchase({ paymentId, valueINR }) {
  try {
    if (!paymentId) return;
    const guardKey = `ads_conv_fired_${paymentId}`;
    if (sessionStorage.getItem(guardKey)) {
      console.log('[Ads] Conversion already fired for', paymentId);
      return;
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: CONVERSION_SEND_TO,
        value: Number(valueINR) || 1.0,
        currency: 'INR',
        transaction_id: paymentId,
      });
      sessionStorage.setItem(guardKey, '1');
      console.log('[Ads] Conversion fired:', { paymentId, valueINR });
    } else {
      console.warn('[Ads] gtag not available; skip fire.');
    }
  } catch (e) {
    console.error('[Ads] Conversion fire error:', e);
  }
}

const PaymentMobile = () => {
  // 🔍 Debug: see what React sees from .env at runtime
  console.log(
    'FRONTEND RAZORPAY KEY FROM ENV (process.env):',
    process.env.REACT_APP_RAZORPAY_KEY_ID
  );

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
    1; // default ₹1 fallback

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
  const storedEmail =
    localStorage.getItem('userEmail') || (userInfo?.email ?? '');

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
  // NOTE: keeping same amount logic as current Payment.js (test ₹1)
  const amount = 1;
  const file_key = resolvedFileKey;

  // Persist payment context so refresh doesn't lose it
  useEffect(() => {
    if (reportId) {
      localStorage.setItem('reportId', reportId);
      localStorage.setItem('lastReportId', reportId);
    }
    if (file_key) localStorage.setItem('fileKey', file_key);
    if (amount != null) localStorage.setItem('amount', String(amount));
    try {
      if (reportId) cxtDispatch({ type: 'SET_REPORT_ID', payload: reportId });
      if (file_key) cxtDispatch({ type: 'SET_FILE_KEY', payload: file_key });
    } catch {
      // ignore if reducer doesn't handle these
    }
  }, [reportId, file_key, amount, cxtDispatch]);

  useEffect(() => {
    console.log('PaymentMobile - Initial state:', {
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
        console.error(
          'Error saving user details:',
          errorData.error || 'Unknown error'
        );
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
      if (
        !inputEmail.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)
      ) {
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
      }, 10000);
    });

  const handlePayment = async () => {
    console.log('handlePayment (mobile) started', {
      reportId,
      amount,
      file_key,
      userId,
      inputName,
      inputEmail,
      verify,
      authToken: localStorage.getItem('authToken'),
      userInfoToken: userInfo?.token,
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
      navigate('/login');
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
      console.log('Razorpay SDK confirmed (mobile):', !!window.Razorpay);
    } catch (e) {
      console.error('Razorpay SDK error:', e.message);
      setError('Failed to load payment gateway. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Step 3: Fetch Razorpay order
    try {
      const token = localStorage.getItem('authToken') || userInfo?.token;
      if (!token) {
        console.error('No auth token found in localStorage or userInfo');
        setError('Authentication error. Please log in again and retry.');
        navigate('/login');
        setLoading(false);
        return;
      }

      console.log('Fetching create-razorpay-order (mobile) with:', {
        body: JSON.stringify({
          reportId,
          amount: Math.round(Number(amount) * 100),
          userId,
        }),
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
            body: JSON.stringify({
              reportId,
              amount: Math.round(Number(amount) * 100),
              userId,
            }),
          }),
        }
      );

      console.log(
        'create-razorpay-order response status (mobile):',
        response.status
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('create-razorpay-order error:', errorText);
        setError(`Failed to initiate payment: ${errorText || 'Server error'}`);
        setLoading(false);
        return;
      }

      const order = await response.json();
      console.log('Razorpay order response (mobile):', order);
      const parsedBody = JSON.parse(order.body);

      // ---- Step 4: Resolve order details (PREFER server key_id) ----
      const orderId = parsedBody?.razorpay_response?.id;
      const orderAmount =
        parsedBody?.razorpay_response?.amount ||
        Math.round(Number(amount) * 100);
      const orderCurrency = parsedBody?.razorpay_response?.currency || 'INR';
      const keyFromOrder = parsedBody?.key_id || null;

      const razorpayKey =
        keyFromOrder ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        (typeof window !== 'undefined' && window._env_?.RAZORPAY_KEY_ID) ||
        localStorage.getItem('razorpayKey') ||
        null;

      console.log(
        'ENV RAZORPAY KEY (inside handlePayment mobile):',
        process.env.REACT_APP_RAZORPAY_KEY_ID
      );
      console.log('keyFromOrder:', keyFromOrder);
      console.log('Resolved Razorpay key (mobile):', razorpayKey, 'Order ID:', orderId);

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

      console.log('Opening Razorpay popup with order (mobile):', orderId);

      // Step 5: Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: `Purchase of report ${reportId}`,
        image: '/logo.svg',
        order_id: orderId,
        handler: async (response) => {
          try {
            console.log('Verifying payment (mobile) with:', {
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
                  body: JSON.stringify({
                    reportId,
                    userId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                }),
              }
            );

            console.log(
              'verify-payment response status (mobile):',
              verifyResponse.status
            );
            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.text();
              throw new Error(
                `Verification failed: ${verifyError || 'Unknown server error'}`
              );
            }

            const verifyData = await verifyResponse.json();
            console.log('Payment verification response (mobile):', verifyData);

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

            // ✅ Fire Google Ads Purchase conversion (once per payment id)
            fireGoogleAdsPurchase({
              paymentId: response.razorpay_payment_id,
              valueINR: Number(amount),
            });

            // ✅ Save user details then go to Purchase Success screen
            await saveUserDetails();

            navigate('/purchase-success', {
              replace: true,
              state: {
                amount: Number(amount),
                reportId,
                fileKey: file_key,
                razorpayPaymentId: response.razorpay_payment_id,
                loggedIn: true,
              },
            });
          } catch (err) {
            console.error(
              'Payment verification error (mobile):',
              err.message,
              err.stack
            );
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
            console.log('Razorpay modal closed by user (mobile)');
            setError('Payment cancelled. Please try again.');
            setLoading(false);
          },
        },
      };

      console.log('Razorpay options (mobile):', options);

      // Step 6: Open Razorpay modal
      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          console.error(
            'Payment failed (mobile):',
            response?.error?.description
          );
          setError(
            `Payment failed: ${response?.error?.description || 'Unknown'}`
          );
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
                razorpayPaymentId:
                  response?.error?.metadata?.payment_id || null,
                razorpayOrderId: orderId,
                razorpaySignature: null,
                timestamp: new Date().toISOString(),
              }),
            }
          );
          setLoading(false);
        });

        console.log('Opening Razorpay modal (mobile)');
        rzp.open();
      } catch (err) {
        console.error('Razorpay initialization error (mobile):', err.message);
        setError(`Failed to open payment gateway: ${err.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error(
        'Payment initiation error (mobile):',
        error.message,
        error.stack
      );
      setError(`Failed to initiate payment: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="payments-page-mobile">
      {/* Header / branding */}
      <div className="payments-mobile-header">
        <div className="payments-mobile-title">Secure Payment</div>
        <div className="payments-mobile-subtitle">
          Rajan Business Ideas Pvt. Ltd
        </div>
      </div>

      {/* Order summary card */}
      <div className="payments-mobile-card payments-mobile-card--order">
        <div className="payments-mobile-card-label">Order summary</div>
        <div className="payments-mobile-row">
          <span className="payments-mobile-label">Report ID</span>
          <span className="payments-mobile-value">
            {reportId || 'Not available'}
          </span>
        </div>
        <div className="payments-mobile-row payments-mobile-row--amount">
          <span className="payments-mobile-label">Amount</span>
          <span className="payments-mobile-amount">₹{amount || 0}</span>
        </div>
      </div>

      {/* Personal details */}
      <div className="payments-mobile-card">
        <div className="payments-mobile-card-icon-row">
          <img src={Personal} alt="Personal" className="payments-mobile-icon" />
          <span className="payments-mobile-card-label">Your details</span>
        </div>

        {/* Name */}
        <div className="payments-mobile-field">
          <div className="payments-mobile-field-top">
            <span className="payments-mobile-label">Name</span>
            <img
              src={pencil}
              alt="Edit name"
              onClick={() => setEditName(!editName)}
              className="payments-mobile-edit-icon"
            />
          </div>
          {editName ? (
            <input
              id="nameInput"
              className="payments-mobile-input"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={handleName}
              placeholder="Enter your full name"
            />
          ) : (
            <div className="payments-mobile-value">{inputName || 'Not set'}</div>
          )}
        </div>

        {/* Phone */}
        <div className="payments-mobile-field">
          <div className="payments-mobile-field-top">
            <span className="payments-mobile-label">Phone number</span>
          </div>
          <div className="payments-mobile-value">
            {storedPhone || 'Not available'}
          </div>
        </div>
      </div>

      {/* Delivery / email details */}
      <div className="payments-mobile-card">
        <div className="payments-mobile-card-icon-row">
          <img
            src={Delivery}
            alt="Delivery"
            className="payments-mobile-icon"
          />
          <span className="payments-mobile-card-label">Report delivery</span>
        </div>

        {/* Email */}
        <div className="payments-mobile-field">
          <div className="payments-mobile-field-top">
            <span className="payments-mobile-label">Email for delivery</span>
            <img
              src={pencil}
              alt="Edit email"
              onClick={() => setEditEmail(!editEmail)}
              className="payments-mobile-edit-icon"
            />
          </div>
          {editEmail ? (
            <input
              id="emailInput"
              className="payments-mobile-input"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              onKeyDown={handleEmail}
              placeholder="you@example.com"
            />
          ) : (
            <div className="payments-mobile-value">
              {inputEmail || 'Not set'}
            </div>
          )}
        </div>

        {success && (
          <div className="payments-mobile-success">
            <img src={green} alt="Success" />
            <span>Your email has been updated successfully.</span>
          </div>
        )}
      </div>

      {/* Terms + Pay button */}
      <div className="payments-mobile-card payments-mobile-card--footer">
        <label className="payments-mobile-terms">
          <input
            className="payments-mobile-checkbox"
            type="checkbox"
            id="verify"
            checked={verify}
            onChange={(e) => setVerify(e.target.checked)}
          />
          <span>
            I agree to all{' '}
            <span className="payments-mobile-terms-link">
              Terms &amp; Conditions
            </span>
          </span>
        </label>

        {error && <div className="payments-mobile-error">{error}</div>}

        <button
          type="button"
          onClick={handlePayment}
          className="payments-mobile-button"
          disabled={loading}
        >
          {loading ? 'Processing…' : `Pay securely ₹${amount || 0}`}
        </button>

        <div className="payments-mobile-gateway-note">
          Payments are processed securely via Razorpay.
        </div>
      </div>
    </div>
  );
};

export default PaymentMobile;

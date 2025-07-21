import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentGateway.css';
import Personal from '../assets/Personal.svg';
import Delivery from '../assets/Delivery.svg';
import pencil from '../assets/pencil.svg';
import green from '../assets/green-tick.svg';

const Payment = () => {
  const { state: { isLogin, userId, name, phone, email }, dispatch: cxtDispatch } = useContext(Store);
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId, amount, file_key } = location.state || {};
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [inputName, setInputName] = useState(name || '');
  const [inputEmail, setInputEmail] = useState(email || '');
  const [verify, setVerify] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Payment.js - isLogin:', isLogin, 'userId:', userId, 'reportId:', reportId, 'amount:', amount, 'file_key:', file_key);
    if (!isLogin) {
      navigate('/login?redirect=/payment');
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => console.log('Razorpay script loaded successfully');
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please try again later.');
      };
      document.body.appendChild(script);
    } catch (e) {
      console.error('Error loading Razorpay script:', e.message);
      setError('Error initializing payment gateway.');
    }

    return () => {
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) document.body.removeChild(script);
    };
  }, [isLogin, userId, navigate]);

  const handleName = (e) => {
    if (e.key === 'Enter') {
      cxtDispatch({ type: 'SET_NAME', payload: inputName });
      setEditName(false);
    }
  };

  const handleEmail = (e) => {
    if (e.key === 'Enter') {
      cxtDispatch({ type: 'SET_EMAIL', payload: inputEmail });
      setEditEmail(false);
      setSuccess(true);
    }
  };

  const handlePayment = async () => {
    setError('');
    setLoading(true);
    console.log('handlePayment called', { reportId, amount, file_key, userId, inputName, inputEmail, verify });
    if (!reportId || !userId || !amount || !inputName || !inputEmail || !verify) {
      setError('Please fill all fields and agree to terms');
      setLoading(false);
      return;
    }
    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in again');
        navigate('/login?redirect=/payment');
        setLoading(false);
        return;
      }

      const response = await fetch('https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, amount: Math.round(amount * 100), userId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create order: ${errorText}`);
      }
      const order = await response.json();
      console.log('Razorpay order response:', order);

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: `Purchase of report ${reportId}`,
        image: '/logo.svg',
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                reportId,
                userId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.text();
              throw new Error(`Verification failed: ${verifyError}`);
            }
            const verifyData = await verifyResponse.json();
            console.log('Payment verification response:', verifyData);

            await fetch('https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod/log-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                reportId,
                file_key,
                userId,
                status: 'success',
                amount: Math.round(amount * 100),
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                timestamp: new Date().toISOString(),
              }),
            });
            navigate('/profile');
          } catch (err) {
            setError(`Payment verification failed: ${err.message}`);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: inputName,
          email: inputEmail,
          contact: phone || userId,
        },
        notes: {
          file_key,
          address: 'Rajan Business Ideas Office',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        console.error('Payment failed:', response.error.description);
        setError(`Payment failed: ${response.error.description}`);
        await fetch('https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod/log-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportId,
            file_key,
            userId,
            status: 'failed',
            amount: Math.round(amount * 100),
            razorpayPaymentId: response.error.metadata.payment_id || null,
            razorpayOrderId: order.id,
            razorpaySignature: null,
            timestamp: new Date().toISOString(),
          }),
        });
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error.message, error.stack);
      setError(`Failed to initiate payment: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="payments-page" style={{ position: 'relative', zIndex: 1000 }}>
      <div className="payments-left">
        <div className="row" style={{ textAlign: "center" }}>
          <img src={Personal} style={{ width: "187px", height: "36px", marginLeft: "15%" }} />
        </div>
        <div className="payment-name mt-2">
          <div style={{ paddingRight: "20px" }}>
            <label style={{ fontSize: "20px", fontWeight: "600" }}>Name:</label>
          </div>
          <div style={{ paddingRight: "30px" }}>
            {editName ? (
              <input
                className="edit-input"
                style={{ border: "none", background: "transparent", borderBottom: "1px solid #0263c7", width: "90%" }}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={handleName}
              />
            ) : (
              <p style={{ fontSize: "20px", fontWeight: "400" }}>{name || inputName}</p>
            )}
          </div>
          <div>
            <img src={pencil} onClick={() => setEditName(!editName)} />
          </div>
        </div>
        <div className="payment-name mt-2">
          <div style={{ paddingRight: "20px" }}>
            <label style={{ fontSize: "20px", fontWeight: "600" }}>Phone Number:</label>
          </div>
          <div style={{ paddingRight: "30px" }}>
            <p style={{ fontSize: "20px", fontWeight: "400" }}>{phone || userId}</p>
          </div>
        </div>
        <div className="row mt-2" style={{ textAlign: "center" }}>
          <img src={Delivery} style={{ width: "187px", height: "36px", marginLeft: "15%" }} />
        </div>
        <div className="payment-name mt-3">
          <div style={{ paddingRight: "20px" }}>
            <label style={{ fontSize: "20px", fontWeight: "600" }}>Email:</label>
          </div>
          <div style={{ paddingRight: "30px" }}>
            {editEmail ? (
              <input
                className="edit-input"
                style={{ border: "none", background: "transparent", borderBottom: "1px solid #0263c7", width: "90%" }}
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                onKeyDown={handleEmail}
              />
            ) : (
              <p style={{ fontSize: "20px", fontWeight: "400" }}>{email || inputEmail}</p>
            )}
          </div>
          <div>
            <img src={pencil} onClick={() => setEditEmail(!editEmail)} />
          </div>
        </div>
        {success && (
          <div className="success-message" style={{ marginLeft: "20%", marginTop: "5%" }}>
            <div>
              <img src={green} />
            </div>
            <div>Your email id has been changed successfully</div>
          </div>
        )}
        <div className="form-check" style={{ paddingLeft: "25%", paddingTop: "5%" }}>
          <input
            className="form-check-input"
            type="checkbox"
            id="verify"
            checked={verify}
            onChange={(e) => setVerify(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="verify">
            <p className="text-secondary">
              I agree to all terms <span className="text-primary">Terms & Conditions</span>
            </p>
          </label>
        </div>
      </div>
      <div className="payments-right">
        <div className="row">
          <p className="pay-price">Total Price: ₹{amount || 0}</p>
        </div>
        <div className="row">
          <button onClick={handlePayment} className="pay-btn" disabled={loading}>
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

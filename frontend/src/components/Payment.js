import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentGateway.css';

const Payment = () => {
  const { state: { isLogin, userId } } = useContext(Store);
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId, amount, file_key } = location.state || {}; // Include file_key in destructuring
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Payment.js - isLogin:', isLogin, 'userId:', userId, 'reportId:', reportId, 'amount:', amount, 'file_key:', file_key, 'location.state:', location.state);
    if (!isLogin) {
      navigate('/login?redirect=/payment');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => console.log('Razorpay script loaded successfully');
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setError('Failed to load payment gateway. Please try again later.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isLogin, userId, navigate]);

  const handlePayment = async () => {
    setError('');
    setLoading(true);
    console.log('handlePayment called', { reportId, amount, file_key, userId });
    if (!reportId || !userId || !amount) {
      setError('Missing required payment information (reportId, userId, or amount)');
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
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Ensure this is in .env
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

            await fetch('https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/log_payment', {
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
          contact: userId,
          name: 'User', // Add a default name if available
        },
        notes: {
          file_key, // Pass file_key as a note
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
    <div className="payment-container">
      <h1>Payment Window</h1>
      {reportId && isLogin && amount ? (
        <>
          <button onClick={handlePayment} className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : `Pay Now (₹${amount})`}
          </button>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </>
      ) : (
        <p>No report selected, invalid amount, or not logged in. Please go back and generate a report.</p>
      )}
    </div>
  );
};

export default Payment;

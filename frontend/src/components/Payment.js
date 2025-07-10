import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentGateway.css';

const Payment = () => {
  const { state: { isLogin, userId } } = useContext(Store);
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId } = location.state || {};
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLogin) {
      navigate('/login?redirect=/payment');
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => console.log('Razorpay script loaded');
    script.onerror = () => setError('Failed to load Razorpay script');
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isLogin, navigate]);

  const handlePayment = async () => {
    setError('');
    setLoading(true);
    if (!reportId || !userId) {
      setError('Missing report or user information');
      setLoading(false);
      return;
    }
    if (!window.Razorpay) {
      setError('Razorpay script failed to load');
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
      const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, amount: 1000, userId }),
      });
      const order = await response.json();
      if (!response.ok) {
        throw new Error(order.error || 'Failed to create order');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: 'Business Report Purchase',
        image: '/logo.svg', // Ensure logo.svg is in public/
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-payment', {
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
            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok) {
              navigate('/profile');
            } else {
              setError(`Payment verification failed: ${verifyData.error}`);
            }
          } catch (err) {
            setError('Failed to verify payment');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          contact: userId,
        },
        notes: {
          address: 'Razorpay Corporate Office',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      setError(`Failed to initiate payment: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <h1>Payment Window</h1>
      {reportId && isLogin ? (
        <>
          <button onClick={handlePayment} className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </>
      ) : (
        <p>No report selected or not logged in. Please go back and generate a report.</p>
      )}
    </div>
  );
};

export default Payment;

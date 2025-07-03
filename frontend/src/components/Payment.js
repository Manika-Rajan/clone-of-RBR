import Axios from "axios";
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import Navbar from './Navbar';
import './ReportDisplay.css';
import './PaymentGateway.css';
import Personal from '../assets/Personal.svg';
import Delivery from '../assets/Delivery.svg';
import pencil from '../assets/pencil.svg';
import green from '../assets/green-tick.svg';
import logo from '../assets/logo.svg';
import { server } from './Server';

const Payment = () => {
  const navigate = useNavigate();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { totalPrice = 10, name, phone, email } = state; // Default to 10 INR
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [inputName, setInputName] = useState(name || '');
  const [inputEmail, setInputEmail] = useState(email || '');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [verify, setVerify] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    setInputName(e.target.value);
    cxtDispatch({ type: 'SET_NAME', payload: e.target.value }); // Update state immediately
  };

  const handleEmailChange = (e) => {
    setInputEmail(e.target.value);
    cxtDispatch({ type: 'SET_EMAIL', payload: e.target.value }); // Update state immediately
    setSuccess(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const showRazorpay = async () => {
    if (!name || !email || !verify) {
      setError(true);
      return;
    }
    setError(false);
    setLoading(true);

    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const response = await Axios.post(
        `${server}razorpay/pay/`,
        { 
          amount: totalPrice || 10, // Ensure 10 INR
          product_name: 'Business Report'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { payment } = response.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: 'INR',
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: 'Business Report Purchase',
        image: logo,
        order_id: payment.id,
        handler: async function (response) {
          try {
            const verifyResponse = await Axios.post(
              `${server}razorpay/payment/success/`,
              { response: JSON.stringify(response) },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            if (verifyResponse.data.message === 'payment successfully received!') {
              setSuccess(true);
              alert('Payment successful!');
              navigate('/report-display');
            } else {
              alert('Payment verification failed!');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: name || '',
          email: email || '',
          contact: phone || '',
        },
        notes: {
          address: 'Razorpay Corporate Office',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
        setLoading(false);
      });
      rzp1.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <Navbar reports />
        <div className="payments-page row mt-4">
          <div className="payments-left col-md-6">
            <div className="row" style={{ textAlign: 'center' }}>
              <img src={Personal} style={{ width: '187px', height: '36px', marginLeft: '15%' }} alt="Personal" />
            </div>
            <div className="payment-name mt-2">
              <div style={{ paddingRight: '20px' }}>
                <label style={{ fontSize: '20px', fontWeight: '600' }}>Name:</label>
              </div>
              <div style={{ paddingRight: '30px' }}>
                {editName ? (
                  <input
                    className="edit-input"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      borderBottom: '1px solid #0263c7',
                      width: '90%',
                    }}
                    name="inputName"
                    value={inputName}
                    onChange={handleNameChange}
                  />
                ) : (
                  <p style={{ fontSize: '20px', fontWeight: '400' }}>{name || 'Enter name'}</p>
                )}
              </div>
              <div>
                <img src={pencil} onClick={() => setEditName(!editName)} alt="Edit" />
              </div>
            </div>
            <div className="payment-name mt-2">
              <div style={{ paddingRight: '20px' }}>
                <label style={{ fontSize: '20px', fontWeight: '600' }}>Phone Number:</label>
              </div>
              <div style={{ paddingRight: '30px' }}>
                <p style={{ fontSize: '20px', fontWeight: '400' }}>{phone || 'N/A'}</p>
              </div>
            </div>
            <div className="row mt-2" style={{ textAlign: 'center' }}>
              <img src={Delivery} style={{ width: '187px', height: '36px', marginLeft: '15%' }} alt="Delivery" />
            </div>
            <div className="payment-name mt-3">
              <div style={{ paddingRight: '20px' }}>
                <label style={{ fontSize: '20px', fontWeight: '600' }}>Email:</label>
              </div>
              <div style={{ paddingRight: '30px' }}>
                {editEmail ? (
                  <input
                    className="edit-input"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      borderBottom: '1px solid #0263c7',
                      width: '90%',
                    }}
                    name="inputEmail"
                    value={inputEmail}
                    onChange={handleEmailChange}
                  />
                ) : (
                  <p style={{ fontSize: '20px', fontWeight: '400' }}>{email || 'Enter email'}</p>
                )}
              </div>
              <div>
                <img src={pencil} onClick={() => setEditEmail(!editEmail)} alt="Edit" />
              </div>
            </div>
            {success && (
              <div className="success-message" style={{ marginLeft: '20%', marginTop: '5%' }}>
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
                name="verify"
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
          <div className="payments-right col-md-6">
            <div className="row">
              <div className="pdf-div"></div>
            </div>
            <div className="row">
              <p className="pay-price">Total Price: ₹{totalPrice || 10}</p>
            </div>
            <div className="row">
              <button onClick={showRazorpay} className="pay-btn" disabled={loading}>
                {loading ? 'Processing...' : 'PAY NOW'}
              </button>
            </div>
            {error && (
              <div className="row">
                <p className="error-message">*Please enter your name, email, and agree to terms to proceed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
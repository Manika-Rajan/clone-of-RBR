import React, { useContext, useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Link, useNavigate } from 'react-router-dom';
import './ReportDisplay.css';
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Login from './Login';
import { Store } from '../Store';
import { Modal, ModalBody } from "reactstrap";
import { useLocation } from 'react-router-dom';

const ReportsDisplay = () => {
  const location = useLocation();
  const fileKey = location.state?.fileKey || '';
  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { isLogin, name, status } = state;

  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');

  // Price (hardcoded for now; adjust based on your logic)
  const reportPrice = 10; // In Rs.

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!fileKey) {
        console.error("No fileKey found.");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_key: fileKey }),
        });
        const data = await response.json();
        if (data.presigned_url) {
          setPdfUrl(data.presigned_url);
          // Set price in store
          cxtDispatch({ type: 'SET_PRICE', payload: reportPrice });
        } else {
          throw new Error('No presigned URL returned');
        }
      } catch (error) {
        console.error('Error fetching presigned URL:', error.message);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [fileKey, cxtDispatch]);

  const loadScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyNow = async () => {
    if (!isLogin) {
      setOpenModel(true);
      return;
    }

    const res = await loadScript();
    if (!res) {
      alert('Razorpay SDK failed to load');
      return;
    }

    // Create order via backend (your Razorpay API endpoint)
    const response = await fetch('YOUR_BACKEND_RAZORPAY_PAY_ENDPOINT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: reportPrice * 100 }), // In paise
    });
    const data = await response.json();

    const options = {
      key: 'YOUR_LIVE_KEY_ID', // Replace with your Razorpay Live key
      amount: data.payment.amount,
      currency: 'INR',
      name: 'Rajan Business Ideas Pvt. Ltd',
      description: 'Report Purchase',
      image: logo,
      order_id: data.payment.id,
      handler: async (response) => {
        // Mock success for now since Razorpay is down
        const paymentData = {
          payment_id: response.razorpay_payment_id || 'mock_payment_id',
          order_id: response.razorpay_order_id || 'mock_order_id',
          signature: response.razorpay_signature || 'mock_signature',
          fileKey, // Pass the report fileKey
          userId: state.userId,
        };

        // Save report to S3 and database
        await fetch('YOUR_BACKEND_SAVE_REPORT_ENDPOINT', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });
        alert('Payment successful! Report saved.');
        navigate('/profile'); // Redirect to profile
      },
      prefill: {
        name: name || '',
        email: state.email || '',
        contact: state.phone || '',
      },
      theme: { color: '#0263c7' },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className='report-display'>
      <nav className="navbar navbar-expand-lg bg-light">
        <div className="container-fluid">
          <div className="nav-left">
            <div className="logo">
              <Link to="/" className="navbar-brand">
                <img src={logo} alt="" style={{ width: "60px", height: "60px" }} />
              </Link>
            </div>
            <div className="text">
              <p className='nav-title report-display-title' style={{ fontSize: "28px" }}>Paper Industry In India</p>
              <p className='report-display-desc' style={{ marginTop: "-10px", width: "70%" }}>
                Candy production is a seasonal business...
              </p>
            </div>
          </div>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="buy-btn" onClick={handleBuyNow} style={{ color: "white" }}>
                  BUY NOW (₹{reportPrice})
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className='viewer col-md-11 col-sm-11 col-11'>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          {isLoading ? (
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : pdfUrl ? (
            <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
          ) : (
            <div>Error loading report</div>
          )}
        </Worker>
      </div>
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(!openModel)}
        style={{ maxWidth: '650px', width: '100%', marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          <Login onClose={() => setOpenModel(false)} />
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ReportsDisplay;

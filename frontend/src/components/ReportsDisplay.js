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
import Otp from './Otp';
import EmailVerify from './EmailVerify';
import { Store } from '../Store';
import { Modal, ModalBody } from "reactstrap";

const ReportsDisplay = () => {
  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { isLogin, name, status, email } = state;
  const [openModel, setOpenModel] = useState(false);
  const [login, setLogin] = useState(true);
  const [otp, sendOtp] = useState(false);
  const [verify, setVerify] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const handlePayment = () => {
    if (isLogin) {
      navigate("/payment");
    } else {
      setOpenModel(true);
      setLogin(true);
    }
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: 'SET_REPORT_STATUS' });
  };

  // Fetch pre-signed URL from the API Gateway
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      try {
        const response = await fetch('https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_key: 'compressed.tracemonkey-pldi-09.pdf' }), // Replace with your actual S3 file key
        });
        const data = await response.json();
        if (data.presigned_url) {
          setPdfUrl(data.presigned_url);
        } else {
          console.error('Failed to fetch pre-signed URL:', data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching pre-signed URL:', error);
      }
    };

    fetchPresignedUrl();
  }, []);

  return (
    <>
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
                  Candy production is a seasonal business, with the majority of those involved in market normally doubling their staffs during the winter months
                </p>
              </div>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <button className="buy-btn" onClick={handlePayment} style={{ color: "white" }}>BUY NOW</button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className='viewer col-md-11 col-sm-11 col-11'>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {pdfUrl ? (
              <Viewer
                const [pdfUrl, setPdfUrl] = useState('https://rbrfinalfiles.s3.amazonaws.com/compressed.tracemonkey-pldi-09.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA5NOTETMQGPCFO5ZY%2F20250127%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250127T095334Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFIaCmFwLXNvdXRoLTEiSDBGAiEAhguM5sVPK7u2O3I8wYvWDiWpaF9GwsJs%2BA2DqZD8Nu4CIQDc3jEE8%2B0LUoKR04NTPbvSXs7%2Fbthmfw0ibgQvNIhQFSqHAwhbEAEaDDkyMjI1MDE1NjgzMiIMBPCp%2BoQcrDN2B9tIKuQC2jWX1Xa4l9OzKRm%2B6pXfdw6e1dtn25bogMZp1JGu2aVF6QmPEiXF7pFgJ0RiG7z91wBL1g%2FtrpG%2BLUANS0c29RfiomlnyPcUJhveDQm8pKiC%2BF%2BJPKTfSax%2Bl4REsPl6jaoi%2Bb78hP3BCHGj6LEYu98xo0CJZ1A25foeQcwFa0EkSOhj0jWRI3l4k5umTbDZ%2B3HouJhm7dcbUOUCe8%2BoC1XS0Md%2F2%2FjUyME%2FeH1jEiqTRFS6IeUbPsvMsnF5%2FQaaNSO9ohcdlSiZYgqskQnzDt6E2EyHLTKAEJTfCsT%2FwybrhlpsWCFS0PlkZ6zt7zw1tE8z6TfDY%2BlU6UlKE6WILOI4KRksluYCzMlCIgREbC0geAhYefoTNu4kZiwGnzu3RfQRG7TXbbqECe7YCq4Si7jy9mifzIjKpVAEbpkhhfTGuyErZ%2BJfMnyGnTASGo9nK4d0c4lUnc%2FG0p5cCeUd6kosDpowkK%2FdvAY6nQH42Hmacq2nn55FttXsLKJI9%2FhCIpBkbLZRQPjTq%2FrX905flHItaWUsXbvWGAhaEy0X4OmuR0abVKw%2FOpaIZoBvDXq5b3jEpxJ1fAtfEtbmtG5bKkUDOC0DbOrvvMaxhZk%2FTEtZlfF%2FKBwhHAmMfL7womn1a6%2F9yRSy8aA76VMt3f4cjjYLSZwZOUcJYErVqMDqT0Cv3%2BTzIiJGvVyK&X-Amz-Signature=c574551b70d280bc13630d666aee3a6e57278445ea82af653e61af18088a501c');
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance]}
              />
            ) : (
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            )}
          </Worker>
        </div>
      </div>
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(!openModel)}
        style={{ maxWidth: '650px', width: '100%', marginTop: "15%" }}
        size="lg">
        <ModalBody>
          {login && <Login sendOtp={sendOtp} setVerify={setVerify} setLogin={setLogin} />}
          {otp && <Otp sendOtp={sendOtp} setVerify={setVerify} setLogin={setVerify} />}
          {verify && <EmailVerify sendOtp={sendOtp} setLogin={setLogin} />}
          {status && (
            <div className='' style={{ textAlign: "center" }}>
              <p className='success-head'>The Report has been successfully sent to</p>
              <p className='success-email'>{email}</p>
              <button className='btn btn-primary' onClick={changeStatus}>Ok</button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default ReportsDisplay;

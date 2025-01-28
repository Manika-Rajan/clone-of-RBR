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
  //const [pdfUrl, setPdfUrl] = useState('');
    // Replace this with the presigned URL you received from Postman
  const [pdfUrl, setPdfUrl] = useState(
    "https://rbrfinalfiles.s3.amazonaws.com/compressed.tracemonkey-pldi-09.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA5NOTETMQCMJL46VV%2F20250128%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250128T035900Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCmFwLXNvdXRoLTEiRjBEAiAvRjjaCE4o9djePsPRzpsKarXSMJIAhYX4bNaeng1THwIgWZNqQKjx8ikwA4fmT%2BllrJQZFG1rhQJcarYDfRpUHhoqhwMIbRABGgw5MjIyNTAxNTY4MzIiDKCnzK0g0n9ThvlIXyrkAlYIVXWhers02NlS9gI1X%2Fp2yoijN7%2F%2Fd0fdLKKEKLqwARBP2swTHjN3KuPBCDyyRo6l2pLtpTq5FBNrf6REeIRiX7D9Fd4i%2Fu%2F1UH%2FYmC4lDvf%2BnZ%2Fi4eRjAThuEuz%2BGwMpyo%2BhxMjgcFsLEz7vmWFIJ0IKM4TGmh003H8xYggVdSSI%2B9KtpXYGCJmX67bDcz1UVHhhfLiCteGQJx%2BtNNXM%2BUjLxnmZ%2Fu78kaIg9wnOCOmuZOj%2F%2B%2BmKi54%2F1CCqNQLOTKUSBXfr1SKIQJFHqAQOuhdP2YEN%2Fiel2xlG9tAmQxW8L2X0xWXw%2BkQ14oJ47mvTPYhsxtYUHmLrgoyD%2BnTA%2F96Hsy48kI%2FYA5eiqU%2BX0jv0vaWnZeVGAqtho77Zs56OxqCxMMCThOV%2F0w%2B90rTFTl3cAlbOHUa0aJBOEHc79%2FW7wJbHbMxeOBo4wvBr%2FkoFOBawQpk1xrK7el4%2BOkx%2Bcc46MOur4bwGOp8BcFuHEgnGupjnvhcEUSB4WUtu1neuMYRIOJh8rU%2FOjwuNF61FoKH9S1CAtJt6j%2BOlgOmF8sRe0oYtIxf7zoWXxGLP%2FY6NwQs6EjT6k9F1k3wa78xYfaVG8S2FZJN3iHBWF%2BDGB%2FAjYfOlp9LFQvmgl%2F%2FZFK4juslaFdmCIVcHi9F8v78TKMkUt%2BK4T4s9GEPxSfxGuUmy20ZeBk77tT2E&X-Amz-Signature=08f92a72caf545641e66ad6e804e7181b531662fa262c40f82a216a71a782fe1"
  );

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

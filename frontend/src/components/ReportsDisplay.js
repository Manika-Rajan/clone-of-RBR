import React, { useContext,useState } from 'react'
import logo from '../assets/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import './ReportDisplay.css'
import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import Login from './Login'
import Otp from './Otp'
import EmailVerify from './EmailVerify'
import pdfFile from '../assets/sample1.pdf'
import { Store } from '../Store';
import {Modal,ModalBody} from "reactstrap"

const ReportsDisplay = () => {

  const navigate=useNavigate()
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const {state,dispatch:cxtDispatch}=useContext(Store)
  const {isLogin,name,status,email}=state
  const [openModel,setOpenModel]=useState(false)
  const [login,setLogin]=useState(true)
  const [otp,sendOtp]=useState(false)
  const [verify,setVerify]=useState(false)

  const handlePayment=()=>{
    if(isLogin)
    {
      navigate("/payment")
    }
    else{
      setOpenModel(true)
        setLogin(true)
    }
  }
  const changeStatus=()=>{
    setOpenModel(false)
    cxtDispatch({type:'SET_REPORT_STATUS'})
  }
  return (
    <>
    <div className='report-display'>
    <nav className="navbar navbar-expand-lg bg-light" >
    <div className="container-fluid">
      <div className="nav-left">
       <div className="logo">
       <Link to="/" className="navbar-brand" >
        <img src={logo} alt="" style={{width:"60px",height:"60px"}} />
       </Link>
       </div>
       <div className="text">
          <p className='nav-title report-display-title' style={{fontSize:"28px"}}>Paper Industry In India</p>
          <p className='report-display-desc' style={{marginTop:"-10px",width:"70%"}}>Candy production is a seasonal business,with the majority of those involved  in market normally doubling their staffs during the winter months</p>
       </div>
      </div>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav ms-auto">
        
          <li className="nav-item">
          <button className="buy-btn" onClick={handlePayment} style={{color:"white"}}
           >BUY NOW</button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <div className='viewer col-md-11 col-sm-11 col-11'>
  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
  <Viewer fileUrl={pdfFile}  
  // plugins={[defaultLayoutPluginInstance]}
   />
</Worker>
  </div>
    </div>
    <Modal
    
    isOpen={openModel}
    toggle={()=>setOpenModel(!openModel)}
    style={{maxWidth: '650px', width: '100%',marginTop:"15%"}}
    size="lg">

    <ModalBody>
    {
      login&&<Login sendOtp={sendOtp}  setVerify={setVerify} setLogin={setLogin}/>
    }
    {
      otp&&<Otp sendOtp={sendOtp}  setVerify={setVerify} setLogin={setVerify}/>
    }
    {
      verify&&<EmailVerify sendOtp={sendOtp}  setLogin={setLogin}/>
    }
    {
      status&&<div className='' style={{textAlign:"center"}}>
      <p className='success-head'>The Report has been successfully sent to</p>
      <p className='success-email'>{email}</p>
      <button className='btn btn-primary' onClick={changeStatus}>Ok</button>
      </div>
    }
    </ModalBody>
    </Modal>
    </>
  )
}

export default ReportsDisplay

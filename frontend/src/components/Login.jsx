import React, { useState, useEffect,useContext } from 'react';
import './Login.css';
import UserPool from './UserPool';
import {Amplify} from 'aws-amplify';
import Auth from '@aws-amplify/auth';
import { Store } from '../Store'
import awsconfig from '../aws-exports.js';
Amplify.configure(awsconfig);

//const NOTSIGNIN="You are not logged in";
//const SIGNEDIN="You have logged in successfully";
//const SIGNEDOUT="You have logged out successfully";
//const WAITINGFOROTP="Enter OTP number";
//const VERIFYNUMBER="Verifying number (Country Code +XX needed)";

const Login = ({sendOtp,setLogin, setVerify}) => {
  setLogin(true)
  sendOtp(false)
  setVerify(false)
  const {state,dispatch:cxtDispatch}=useContext(Store)
  const {totalPrice,name,phone,email,status}=state  

  //const [user, setUser] = useState(null);
  //const [session, setSession] = useState(null);
  //const [otp, setOtp] = useState('');
  const [number, setNumber] = useState('');
  const password = Math.random().toString(6) + 'Abc#';
  //const [number1, setNumber1]=useState('');
  const [otpInput, setOtpInput] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false); // Toggle between send and verify steps
  
  useEffect(() => {
    
  }, []);

const Signup = async (event) => {
    event.preventDefault(); // Prevent default form behavior if wrapped in a form later

    if (!otpSent) {
      // Step 1: Send OTP
      setError('');
      setResponseMessage('');
      setOtpInput('');

      const phoneNumber = `+91${number}`;
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber }),
        });
        const data = await response.json();
        if (response.ok) {
          setResponseMessage('OTP sent! Enter it below:');
          cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
          setOtpSent(true); // Switch to OTP input mode
          setLogin(false);
          sendOtp(true);
          setVerify(false);
        } else {
          setError(`Error: ${data.error || data.message || 'Unknown error'}`);
        }
      } catch (err) {
        setError('Failed to connect to server');
      }
    } else {
      // Step 2: Verify OTP
      setError('');
      setResponseMessage('');
      try {
        const response = await fetch('https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: `+91${number}`, otp: otpInput }),
        });
        const data = await response.json();
        const body = JSON.parse(data.body);
        if (data.statusCode === 200) {
          setResponseMessage(body.message);
          setLogin(false);
          sendOtp(false);
          setVerify(true);
        } else {
          setError(`Error: ${body.error || 'Invalid OTP'}`);
        }
      } catch (err) {
        console.error('Verify OTP Error:', err);
        setError('Failed to verify OTP');
      }
    }
  };  
  
  //const signIn = () => {
    //console.log("signin");
    //console.log(VERIFYNUMBER);
    //Auth.signIn(number)
      //.then((result) =>  {
        //console.log('verifying');
        //setSession(result);
        //console.log(result)
        //console.log(WAITINGFOROTP);
        //sendOtp(true)
      //}).then(()=>verifyOtp())
      //.catch((e) => {
        //if (e.code === 'UsernameExistsException') {
          //console.log(WAITINGFOROTP);
          
          //signIn();
        //} else {
          //console.log(e.code);
          //console.error(e);
        //}
     // });
  //};
  
  //const signOut=() => {
    //if (user){
      //Auth.signOut();
      //setUser(null);
      
     // console.log(NOTSIGNIN);
   // }
  //};
 // const verifyOtp = (result) => {
  //  console.log('otp verify')
    //setSession(result)
  //  console.log(otp)
    //console.log(session)
    //Auth.sendCustomChallengeAnswer(session, otp)
      //.then((user) => {
        
        //setUser(user);
        //console.log(SIGNEDIN);
        //setSession(null);
     // }).then(()=>verifyAuth())
      //.catch((err) => {
        
        //console.log(err.message);
        
        //console.log(err);
    //  });
 // };
  //const verifyAuth=() => {
   /// console.log('auth')
   // Auth.currentAuthenticatedUser()
      //.then((user) => {
       // setUser(user);
        //onsole.log(SIGNEDIN);
        //setSession(null);
     // })
     // .catch((err) => {
       // console.error(err);
        //console.log(NOTSIGNIN);
      //});
 // };
  //const Signup = (event)=>{
    
    //const onSubmit=(event)=>{
      //event.preventDefault();
      //let number1 ="+91"+number;
      //console.log(number1)
      // cxtDispatch({type:'SET_PHONE',payload:number1})
      //UserPool.signUp(number1, password,[], null, (err,data)=>{
      //  if(err){
      //   console.error(err);
      //  }
       // console.log(data);
        //setLogin(false)
        //sendOtp(true)
        //setVerify(false)
        //
     // })
   // }
    //console.log(number);
    //const result = await Auth.signUp({
      
      //username: number,
      //password,
      //attributes: {
       // phone_number: number,
     // },
    //}).then(() => signIn());

    
    
 // };
  
  
  return (
    <div className='login-popup-container'>
    <div className='login-popup' >
      
      <div className='login-title'>
        <h3>Please Enter Your Mobile Number</h3>
      </div>
      <div className='login-paragraph'>
      <p>We will send you a <strong>One Time Password</strong> </p>
    </div>
    <div className='login-phone-input' style={{width:"70%",textAlign:"center",margin:"auto"}}>
    <div class="input-group mb-3" style={{marginRight:"20px",width:"23%"}}>
    <select class="form-select" aria-label="Default select example">
            <option selected>+91</option>
            <option value="2">+11</option>
            </select>

     </div>
     <div class="input-group mb-3">
     <input type="text" class="form-control" placeholder="Enter Your 10 digit Mobile Number" style={{textAlign:"center"}} value={number} onChange={(event)=>setNumber(event.target.value)} maxLength={10}/>
   </div>
     </div>
     <div>
     <button type="submit" className='login-button'
      onClick={Signup}
     >{otpSent ? 'VERIFY OTP' : 'SEND OTP'}</button>
     </div>
      {otpSent && (
          <div className="otp-fields">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={6}
            />
          </div>
      )}
        {responseMessage && <p style={{ color: 'green', textAlign: 'center' }}>{responseMessage}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
     </div>
    </div>
  )
}

export default Login

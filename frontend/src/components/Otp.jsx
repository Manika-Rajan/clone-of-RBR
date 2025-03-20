import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import React, { useState } from 'react';
import { CognitoIdentityProvider } from 'aws-sdk';
import UserPool from './UserPool';
import './Login.css'
import './Login'





const Otp = ({setVerify,sendOtp,setLogin}) => {
  const [otp, setOtp] = useState('');
 
  const userData = {
    Username: 'phone_number',
    Pool: UserPool
  }

  const cognitoClient = new CognitoUser(userData);
  const handleVerificationAndConfirmation = async () => {
    try {
      const verifyAttributeParams = {
        //AccessToken: '', // Replace with the actual user access token
        AttributeName: 'phone_number', // Replace with the attribute name you used for phone number verification
        Code: otp // The received OTP code from the user input
      };

      // Verify the user attribute (OTP)
      const verifyAttributeResponse = await cognitoClient.verifyAttribute(verifyAttributeParams).promise();

      if (verifyAttributeResponse.$response.error) {
        console.log('OTP verification failed.');
        return;
      }

      console.log('OTP verification succeeded.');
      const confirmSignUpParams = {
        ClientId: '1glle7bvkfkrqt77p19jpqelss', // Replace with your Cognito client ID
        Username: 'phone_number', // Replace with the user's username
        ConfirmationCode: otp // The received OTP code from the user input
      };

      // Confirm the user
      const confirmSignUpResponse = await cognitoClient.confirmSignUp(confirmSignUpParams).promise();

      if (confirmSignUpResponse.$response.error) {
        console.log('User confirmation failed.');
        return;
      }

      console.log('User confirmed successfully.');


    } catch (error) {
      console.log('Error:', error);
    }
      sendOtp(false)
      setLogin(false)
      setVerify(true)
  };
  
  return (
    <div>
    <div  className='login-popup'>
    <div className='login-title' style={{padding:"0 20px"}}>
      <h3>Please Enter the One Time Password to Login</h3>
    </div>
    <div className='login-paragraph'>
    <p>OTP has been sent </p>
  <div className="otp-fields">
  <input className='otp-input' type="text" value={otp} onChange={(e) => setOtp(e.target.value)} />
    
   </div>
   </div>
   
   <div>
   <button className='login-button' onClick={handleVerificationAndConfirmation}>LOGIN</button>
   <p style={{color:" #0263C7",marginTop:"15px"}}>RESEND OTP</p>
   <p style={{color:"#0263C7"}}><a href='Login.jsx'> Entered a Wrong Mobile Number?</a></p>
   </div>
  </div>
    </div>
  )
}

export default Otp

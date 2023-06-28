import React, { useState, useEffect,useContext } from 'react'
import {Amplify} from 'aws-amplify';
import './Login.css';
import { Auth } from 'aws-amplify';

import UserPoolEmail from './UserPoolEmail';
//Amplify.configure(config);
import { Store } from '../Store'
const EmailVerify = ({setVerify,sendOtp,setLogin}) => {
  const [email1, setEmail1]=useState('');
  const {state,dispatch:cxtDispatch}=useContext(Store)
  const {totalPrice,name,phone,email,status}=state  
  const password= Math.random().toString(6)+'Abc#';
  useEffect(() => {
    
  }, []);
    
    const Signup = (event)=>{
      console.log(email1)
      console.log(password)
      cxtDispatch({type:'SET_EMAIL',payload:email1})
      //const onSubmit=(event)=>{
        event.preventDefault();
        UserPoolEmail.signUp(email1, password,[], null, (err,data)=>{
          if(err){
            console.error(err);
          }
          console.log(data);
          cxtDispatch({type:'USER_LOGIN',payload:true})

          setLogin(false)
          sendOtp(false)
          setVerify(false)

        })
    
      };
  return (
    <div>
    <div className='login-popup'>
    <div className='login-title'>
      <h3 className='login-title'>Please Verify Your Email Id</h3>
    </div>
    <div className='login-paragraph'>
    <p>We will send you a <strong>Verification Link</strong> </p>
  </div>
  <div className='login-phone-input' style={{width:"70%",textAlign:"center",margin:"auto"}}>
   <div class="input-group mb-2">
   <input type="email"  class="form-control" placeholder="Enter Your email id here" value={email1} style={{textAlign:"center"}} onChange={(event)=>setEmail1(event.target.value)}/>
 </div>
   </div>
   <div className='mb-4' style={{marginTop:"35px"}}>
   <button onClick={Signup} className='login-button'
   >Verify</button>
   </div>
   <i className="text-primary">Note:This is a onetime verification.The report will be delivered to this email.</i>
  </div>
    </div>
  )

  }
export default EmailVerify

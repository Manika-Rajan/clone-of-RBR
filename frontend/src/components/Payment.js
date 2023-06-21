import Axios from "axios";
import React, { useContext, useState } from 'react'
import Navbar from './Navbar'
import './ReportDisplay.css'
import { server } from "./Server";
import "./PaymentGateway.css"
import Personal from '../assets/Personal.svg'
import Delivery from '../assets/Delivery.svg'
import pencil from '../assets/pencil.svg'
import green from '../assets/green-tick.svg'
import { Store } from '../Store'
import logo from '../assets/logo.svg'

import { useNavigate } from 'react-router-dom'
const Payment = () => {
    const navigate=useNavigate()
    const {state,dispatch:cxtDispatch}=useContext(Store)
    const {totalPrice,name,phone,email,status}=state
    const [editName,setEditName]=useState(false)
    const [editEmail,setEditEmail]=useState(false)
    const [inputName,setInputname]=useState('')
    const [inputEmail,setInputEmail]=useState('')

    const [success,setSuccess]=useState(false)
    const [error,setError]=useState(false)
    const [verify,setVerify]=useState(false)


    const handleName=(e)=>{
      if (e.key === 'Enter') {
         cxtDispatch({type:'SET_NAME',payload:inputName})
         setEditName(false)
      }
    }
    const handleEmail=(e)=>{
      if (e.key === 'Enter') {
        cxtDispatch({type:'SET_EMAIL',payload:inputEmail})
        setEditEmail(false)
        setSuccess(true)
     }
    }

    const [amount, setAmount] = useState();
    const handlePaymentSuccess = async (response) => {
      try {
        let bodyData = new FormData();
  
        // we will send the response we've got from razorpay to the backend to validate the payment
        bodyData.append("response", JSON.stringify(response));
  
        await Axios({
          url: `${server}/razorpay/payment/success/`,
          method: "POST",
          data: bodyData,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
          .then((res) => {
            console.log("Everything is OK!");
            
            
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log(console.error());
      }
    };
  
    // this will load a script tag which will open up Razorpay payment card to make //transactions
    const loadScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
    };
    const showRazorpay = async () => {
      if(name&&email&&verify)
      {
        setError(false)
      const res = await loadScript();
  
      let bodyData = new FormData();
      console.log(amount);
      setAmount({totalPrice});
  
  
      // we will pass the amount and product name to the backend using form data
      bodyData.append("amount", totalPrice.toString());
      
      
      const data = await Axios({
        url: `${server}/razorpay/pay/`,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: bodyData,
      }).then((res) => {
       
        return res;
      });
  
      // in data we will receive an object from the backend with the information about the payment
      //that has been made by the user
  
      var options = {
        key_id: process.env.REACT_APP_PUBLIC_KEY, // in react your environment variable must start with REACT_APP_
        key_secret: process.env.REACT_APP_SECRET_KEY,
        amount: data.data.payment.amount,
        currency: "INR",
        name: "Rajan Business Ideas Pvt. Ltd",
        description: "Test transaction",
        image: {logo}, // add image url
        order_id: data.data.payment.id,
        handler: function (response) {
          // we will handle success by calling handlePaymentSuccess method and
          // will pass the response that we've got from razorpay
          handlePaymentSuccess(response);
          
        

        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#3399cc",
        },
      };
  
      var rzp1 = new window.Razorpay(options);
      rzp1.open();}
      else{
         setError(true)
      }
      
    };
  return (
    <>
    <div>
    <Navbar reports/>
     <div className='payments-page row mt-4'>
      <div className='payments-left col-md-6'>
         <div className='row' style={{textAlign:"center"}}>
         <img src={Personal} style={{width:"187px",height:"36px",marginLeft:"15%"}}/>
         </div>
         <div className='payment-name mt-2'>
         <div className="" style={{paddingRight:"20px"}}>
         <label style={{fontSize:"20px",fontWeight:"600"}}>Name:</label>       
           </div>
           <div className='' style={{paddingRight:"30px"}}>
           {
            editName? <input  className='edit-input'  style={{border:"none",background:"transparent",borderBottom:"1px solid #0263c7",width:"90%"}} name="inputName" value={inputName} onChange={(e)=>setInputname(e.target.value)} onKeyDown={handleName}
            
            />:
            <p style={{fontSize:"20px",fontWeight:"400"}}>{name}</p>
           }
          
           </div>
           <div className=''>
           <img src={pencil} onClick={()=>setEditName(!editName)} />
           </div>
         </div>
         <div className='payment-name mt-2'>
         <div className="" style={{paddingRight:"20px"}}>
         <label style={{fontSize:"20px",fontWeight:"600"}}>Phone Number:</label>       
           </div>
           <div className='' style={{paddingRight:"30px"}}>
           <p style={{fontSize:"20px",fontWeight:"400"}}>{phone}</p>
           </div>
         </div>
         <div className='row mt-2'style={{textAlign:"center"}}>
         <img src={Delivery} style={{width:"187px",height:"36px",marginLeft:"15%"}}/>
         </div>
         <div className='payment-name mt-3'>
         <div className="" style={{paddingRight:"20px"}}>
         <label style={{fontSize:"20px",fontWeight:"600"}}>Email:</label>       
           </div>
           <div className='' style={{paddingRight:"30px"}}>
           {
            editEmail? <input className='edit-input' style={{border:"none",background:"transparent",borderBottom:"1px solid #0263c7",width:"90%"}}
            name="inputEmail" value={inputEmail}
            onChange={(e)=>setInputEmail(e.target.value)}
            onKeyDown={handleEmail}
            />:
            <p style={{fontSize:"20px",fontWeight:"400"}}>{email}</p>
           }
           
           </div>
           <div className=''>
           <img src={pencil} onClick={()=>setEditEmail(!editEmail)}/>
           </div>
         </div>
         {success&&<div class="success-message" style={{marginLeft:"20%" ,marginTop:"5%"}}>
         <div>
         <img src={green}/>
         </div>
         <div>
         Your email id has been changed successfully
         </div>
       </div>}
      <div class="form-check" style={{paddingLeft:"25%" ,paddingTop:"5%"}}>
      <input class="form-check-input" type="checkbox" name="verify" id="verify" onChange={(e)=>setVerify(e.target.checked)} />
      <label class="form-check-label" for="country">
      <p className='text-secondary'>  I agree to all terms <span className='text-primary'>Terms&Conditions</span></p>
      </label>
    </div>
   
      </div>
      <div className='payments-right col-md-6'>
      <div className='row'>
      <div className='pdf-div'>

      </div>
      </div>
      <div className='row'>
      <p className='pay-price'>Total Price:₹{totalPrice}</p>
      </div>
      <div className='row'>
       <button onClick={showRazorpay} className='pay-btn '>PAY NOW</button>
      </div>
      {error&&<div className='row'>
      <p className='error-message'>*Please enter your name to proceed</p>
     </div>}

      </div>
     </div>

    </div>
   
   </>
  )
}

export default Payment

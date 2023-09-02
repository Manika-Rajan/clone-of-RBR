import React from 'react'
import comming from '../assets/comming.svg'
import Navbar from './Navbar' 

const CommingSoon = () => {
  return (
    <div>
    <Navbar/>
     <div className='row' style={{background:"white"}}></div>
    <div className='col-md-5 col-sm-11 col-11'  style={{margin:"2% auto",textAlign:"center"}}>
      <div >
      <img src={comming}/>
      </div>
      <div>
      <p className='comming-head'>Coming Soon!</p>
      </div>
      <div>
      <p className='text-primary'>We are currently working hard on this page. 
      Get notified when we launch.</p>
      </div>
      <div>
      <form>
      <input placeholder='Please Enter your email address' className='comming-email'/>&nbsp;&nbsp;&nbsp;
      <button className='notify-btn'>NOTIFY ME</button>
      </form>
      </div>
      </div>
    </div>
  )
}

export default CommingSoon

import React from 'react'
import './Footer.css';
import facebook from '../assets/facebook.svg';
import twitter from '../assets/twitter.svg';
import linkedin from '../assets/linkedin.svg';
import {Link} from 'react-router-dom'
const Footer = () => {
  return (

    <div className='row footer'>
    <div className='row'>
      <div className='col-md-2 col-sm-6 col-12' >
      <div>
      <p className='footer-head'>Get to Know Us</p></div>
      <ul>
     <u ><li><Link to="/about" style={{color:"white"}}>About Us</Link></li></u>
     <u> <li>Careers</li></u>
     <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon" >Press Releases</Link></li></u> 
     <u style={{color:"#0263C7"}}> <li className='text-primary'><Link to="/commingSoon">RB Ideas Cares</Link></li></u>
     <u style={{color:"#0263C7"}}> <li className='text-primary'><Link to="/commingSoon">Gift a Smile</Link></li></u>
     <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/comminSoon">RB Ideas Science</Link></li></u>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' >
      <p className='footer-head'>Make Money with Us</p>
      <ul>
      <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon">Sell on our Business Ideas Page</Link></li></u>
      <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon">Sell on our Field Reports Page</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="commingSoon">RB Ideas Global Selling</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">Become an Affiliate</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">Fulfilment by RB Ideas</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">Advertise Your Products</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">RB Ideas Pay</Link></li></u>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' >
      <p className='footer-head'>Let Us Help You</p>
      <ul>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">Covid-19 and RB Ideas
     </Link></li></u> <u>
      <li> Your Account  </li></u>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><a>Returns Centre</a></li></u> <u >
    <li><Link to="/commingSoon" style={{color:"white"}}>100% Purchase Protection </Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><a> RB Ideas App Download </a></li></u>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon">RB Ideas Desktop Assistant Download</Link></li></u> <u >
      <li><a> Help</a></li></u>
      </ul>
      </div>
      <div className='col-md-4 col-sm-6 col-12' >
      <p className='footer-head'>Connect with Us</p>
     <ul style={{marginLeft:"-5%"}}> <u><li><Link to="/contact" style={{color:"white"}}>Contact us</Link></li></u></ul>
      <div className='social-media mb-4'>
      <img src={facebook}/>&nbsp;&nbsp;&nbsp;
      <img src={twitter}/>&nbsp;&nbsp;&nbsp;
      <img src={linkedin}/>

      </div>
      <p>Didn’t find what you are looking for?</p>
      <form>
      <input placeholder='Enter your email address' className='footer-email'/>&nbsp;&nbsp;&nbsp;
      <button className='notify-btn'>NOTIFY ME</button>
      </form>
      </div>
    </div>
    <div className='row'>
    <div className='col-md-5 col-sm-4 col-4'>
    <u><p>©
    2023 Rajan Business Ideas Pvt. Ltd.</p></u>
    </div>
    <div  className='col-md-2 col-sm-2 col-4'>
    <p>Terms & Conditions
    </p>
    </div >
    <div  className='col-md-2 col-sm-4 col-4'>
    <p>Privacy Policy</p>
    </div>
    </div>
    </div>
  )
}

export default Footer

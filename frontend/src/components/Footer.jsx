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
     <u ><li><Link to="/about" style={{color:"white"}}  onClick={() => window.scrollTo(0, 0)}>About Us</Link></li></u>
     <u> <li>Careers</li></u>
     <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Press Releases</Link></li></u> 
     <u style={{color:"#0263C7"}}> <li className='text-primary'><Link to="/commingSoon" onClick={() => window.scrollTo(0, 0)}>RB Ideas Cares</Link></li></u>
     <u style={{color:"#0263C7"}}> <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Gift a Smile</Link></li></u>
     <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/comminSoon"  onClick={() => window.scrollTo(0, 0)}>RB Ideas Science</Link></li></u>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' >
      <p className='footer-head'>Make Money with Us</p>
      <ul>
      <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Sell on our Business Ideas Page</Link></li></u>
      <u style={{color:"#0263C7"}}><li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Sell on our Field Reports Page</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>RB Ideas Global Selling</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Become an Affiliate</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Fulfilment by RB Ideas</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Advertise Your Products</Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>RB Ideas Pay</Link></li></u>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' >
      <p className='footer-head'>Let Us Help You</p>
      <ul>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>Covid-19 and RB Ideas
     </Link></li></u> <u>
      <li> Your Account  </li></u>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><a>Returns Centre</a></li></u> <u >
    <li><Link to="/commingSoon" style={{color:"white"}}  onClick={() => window.scrollTo(0, 0)}>100% Purchase Protection </Link></li></u> <u style={{color:"#0263C7"}}>
      <li className='text-primary'><a> RB Ideas App Download </a></li></u>
      <u style={{color:"#0263C7"}}>
      <li className='text-primary'><Link to="/commingSoon"  onClick={() => window.scrollTo(0, 0)}>RB Ideas Desktop Assistant Download</Link></li></u> <u >
      <li><a> Help</a></li></u>
      </ul>
      </div>
      <div className='col-md-4 col-sm-6 col-12' >
      <p className='footer-head'>Connect with Us</p>
     <ul style={{marginLeft:"-5%"}}> <u><li><Link to="/contact" style={{color:"white"}}  onClick={() => window.scrollTo(0, 0)}>Contact us</Link></li></u></ul>
      <div className='social-media mb-4'>
      <a href="https://www.facebook.com/RajanBusinessIdeas"><img src={facebook}  style={{cursor:"pointer"}}/></a>&nbsp;&nbsp;&nbsp;
      <a href=""><img src={twitter}  style={{cursor:"pointer"}}/></a>&nbsp;&nbsp;&nbsp;
      <a href="https://www.linkedin.com/in/rajan-business-ideas-24351811a/?originalSubdomain=in"><img src={linkedin}  style={{cursor:"pointer"}}/></a>

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

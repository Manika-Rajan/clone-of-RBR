import React from 'react'
import './Footer.css';
import facebook from '../assets/facebook.png';
import twitter from '../assets/twitter.png';
import linkedin from '../assets/linkedin.png';
const Footer = () => {
  return (
    <div className='row footer'>
      <div className='col-md-2 col-sm-6 col-12' style={{margin:"auto"}}>
      <p className='footer-head'>Get to Know Us</p>
      <ul>
      <li><a>About Us</a></li>
      <li>Careers</li>
      <li className='text-primary'><a>Press Releases</a></li>
      <li className='text-primary'><a>RB Ideas Cares</a></li>
      <li className='text-primary'><a>Gift a Smile</a></li>
      <li className='text-primary'><a>RB Ideas Science</a></li>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' style={{margin:"auto"}}>
      <p className='footer-head'>Make Money with Us</p>
      <ul>
      <li className='text-primary'><a>Sell on our Business Ideas Page</a></li>
      <li className='text-primary'>Sell on our Field Reports Page</li>
      <li className='text-primary'><a>RB Ideas Global Selling</a></li>
      <li className='text-primary'><a>Become an Affiliate</a></li>
      <li className='text-primary'><a>Fulfilment by RB Ideas</a></li>
      <li className='text-primary'><a>Advertise Your Products</a></li>
      <li className='text-primary'><a>RB Ideas Pay</a></li>
      </ul>
      </div>
      <div className='col-md-3 col-sm-6 col-12' style={{margin:"auto"}}>
      <p className='footer-head'>Let Us Help You</p>
      <ul>
      <li className='text-primary'><a>Covid-19 and RB Ideas
     </a></li>
      <li> Your Account  </li>
      <li className='text-primary'><a>Returns Centre</a></li>
      <li><a>100% Purchase Protection </a></li>
      <li className='text-primary'><a> RB Ideas App Download </a></li>
      <li className='text-primary'><a>RB Ideas Desktop Assistant Download</a></li>
      <li><a> Help</a></li>
      </ul>
      </div>
      <div className='col-md-4 col-sm-6 col-12' style={{margin:"auto"}}>
      <p className='footer-head'>Connect with Us</p>
      <ul><li>Contact us</li></ul>
      <div className='social-media'>
      <img src={facebook}/>&nbsp;&nbsp;&nbsp;
      <img src={twitter}/>&nbsp;&nbsp;&nbsp;
      <img src={linkedin}/>

      </div>
      <p>Didn’t find what you are looking for?</p>
      <form>
      <input placeholder='Please Enter your email address here' className='footer-email'/>&nbsp;&nbsp;&nbsp;
      <button className='notify-btn'>Notify Me</button>
      </form>
      </div>
    </div>
  )
}

export default Footer

import React from 'react'
import Navbar from './Navbar'
import './Contact.css'
import phone from '../assets/phone.svg'
import email from '../assets/email.svg'
import location from '../assets/location.svg';
const Contact = () => {
  return (
    <div>
      <Navbar contact/>
      <div className='info-div'>
      <div className='phone-div' style={{textAlign:"center"}}>
      <img src={phone}/>
      <span>Lets's Talk</span>
      <p><strong>+919014794288</strong></p>
      </div>
      <div className='email-div' style={{textAlign:"center"}}>
       <img src={email}/>
       <span>Or Email Us</span>
       <p><strong>support@rajanbusinessIdeas.com</strong></p>
      </div>
      <div className='location-div' style={{textAlign:"center"}}>
       <img src={location}/>
       <span>Visit Us</span>
       <p><strong>Road number 10,Jubilee<br/>
       Hills,Hyderabad,Telangana.</strong></p>
      </div>
      </div>
      <div className='row'>
      <p className='contact-head mt-4'>
      Questions,bug reports,feedback,future requests-we're here for all it
      </p>
      </div>
      <div className='form-div'>
      <form>
      <div className="mb-3">
      <div className='row mt-4' style={{display:'flex',flexDirection:"row"}}>
      <div className='col' style={{marginLeft:"1%",width:"70%"}}>
      <label for="email" className="contact-label">Your Email Address</label>
      <br/>
      <input type="email" className="contact-input" id="email" style={{width:"100%"}}/>
      </div>
     <div className='col' style={{marginTop:"-3%",width:"30%"}}>
      <label for="email" className="contact-label">Mobile Number</label>
      <p className='number-info'>(For us to resolve Your issue with fast communication)</p>
      <input type="email" className="contact-input" id="email"style={{width:"100%",marginTop:"-4%"}}/>
    </div>
    </div>
    </div>

    <div className="mb-3">
      <label for="subject" className="contact-label">Subject</label>
          <br/>

      <input type="subject" className="contact-input" id="subject" style={{width:"100%"}}/>
    </div>
    <div className="mb-3">
    <label for="help" className="contact-label">How can we help?</label>
    <br/>
    <textarea className="contact-input" id="help"  style={{width:"100%",height:"20%"}}/>
  </div>
        <button className='btn  send-btn ms-auto mb-2' style={{float:"right"}}>Send</button>
        </form>
        </div>
    </div>
  )
}

export default Contact

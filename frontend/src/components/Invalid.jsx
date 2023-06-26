import React from 'react'
import invalid from '../assets/invalid.svg'
import Navbar from './Navbar'
import {Link} from 'react-router-dom'
const Invalid = () => {
  return (
    <div>
    <Navbar/>
    <div className='row' >
    <div className='col-md-5 col-sm-11 col-11' style={{margin:"4% auto",textAlign:"center"}}>
      <div >
      <img src={invalid}/>
      </div>
      <div>
      <p className='comming-head text-primary'>Comming Soon!</p>
      <p style={{fontWeight:"500",fontSize:"16px"}}>We can’t find the Page you are looking for. 
      </p>
      </div>
      <div>
      <p className='text-secondary'>Page not found. It may be moved, renamed or temporarily unavailable. Please check the url or go back home.</p>
      </div>
      <div>
      <form>
      <button className='notify-btn'><Link to="/reports" style={{textDecoration:"none",color:"white"}}>Go Back Home</Link></button>
      </form>
      </div>
      </div>
      </div>
    </div>
  )
}

export default Invalid

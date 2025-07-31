import React from 'react'
import './PriceCard.css'
const PriceCard = ({price}) => {
  return (
    <div className='price-card' style={{margin:"auto"}}>
        <div className="card-text">
        <h5>Total Price</h5>
      <p>*including GST</p>
        </div>
       <div className="price">
       <strong>₹{price}</strong>
       </div>
    </div>
  )
}

export default PriceCard

import React, { useContext, useEffect } from 'react'
import Filters from './Filters'
import PriceCard from './PriceCard'
import './Reports.css'
import india from '../assets/india.png'
import Navbar from './Navbar' 
import { useState } from 'react'
import wrong from '../assets/wrong.svg'

import HeadingAfter from './HeadingAfter'
import HeadingBefore from './HeadingBefore'
import vector from '../assets/vector.svg'
import black from '../assets/black.svg'
import { Link, useNavigate } from 'react-router-dom'
import { Store } from '../Store'
const Reports = () => {
  const navigate=useNavigate()
  const {state,dispatch:cxtDispatch}=useContext(Store)
  const {totalPrice}=state

  const [generate,setGenerate]=useState(false)
  const [select_industry,setSelect_industry]=useState([])
  const [select_city,setSelect_city]=useState([])
  const [select_market,setSelect_market]=useState([])
  const [select_pain,setSelect_pain]=useState([])
  const [select_competitors,setSelect_competitors]=useState([])

  const [country,setCountry]=useState(false)
  const [industry,setIndustry]=useState(false)
  const [city,setCity]=useState(false)
  const [market,setMarket]=useState(false)
  const [competitors,setCompetitors]=useState(false)
  const [painpoints,setPainpoints]=useState(false)


  const [expandIndustry,setExpandIndustry]=useState(false)
  const [expandCity,setExpandCity]=useState(false)
  const [expandMarket,setExpandMarket]=useState(false)
  const [expandCompetitors,setExpandCompetitors]=useState(false)
  const [expandPain,setExpandPain]=useState(false)

  const [popup,setPopup]=useState(true)
  const [noSearch,setNoSearch]=useState(false)
  const[nogenerate,setNoGenerate]=useState(false)
 const [price,setPrice]=useState(0)

  const updateIndustry=(value,checked)=>{
    console.log(checked,value)
    setNoSearch(false)
    if(checked)
    {
      setSelect_industry(prev=>[...prev,value])
      calculatePrice(400)

    }
    else
    {
      setSelect_industry((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(400)

    }
  }
  const removeIndustry=(value)=>{
    setSelect_industry((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(400)

  }

  const updateCity=(value,checked)=>{
    console.log(checked,value)
    setNoSearch(false)
    if(checked)
    {
      setSelect_city(prev=>[...prev,value])
      calculatePrice(500)
    }
    else
    {
      setSelect_city((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(500)
    }

  }
  const removeCity=(value)=>{
    setSelect_city((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(500)
  }

  const updateCompetitors=(value,checked)=>{
    console.log(checked,value)
    setNoSearch(false)
    if(checked)
    {
      setSelect_competitors(prev=>[...prev,value])
      calculatePrice(572)
    }
    else
    {
      setSelect_competitors((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(572)

    }

  }
  const removeCompetitors=(value)=>{
    setSelect_competitors((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(572)

  }
 
  const updateMarket=(value,checked)=>{
    console.log(checked,value)
    setNoSearch(false)

    if(checked)
    {
      setSelect_market(prev=>[...prev,value])
      calculatePrice(572)
    }
    else
    {
      setSelect_market((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)

    );
    removePrice(572)

    }

  }
  const removeMarket=(value)=>{
    setSelect_market((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(572)

  }

  const updatePain=(value,checked)=>{
    console.log(checked,value)
    setNoSearch(false)

    if(checked)
    {
      setSelect_pain(prev=>[...prev,value])
  calculatePrice(500)
    }
    else
    {
      setSelect_pain((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(500)
    }

  }
  const removePain=(value)=>{
    setSelect_pain((prevState) =>
      prevState.filter((prevItem) => prevItem !== value)
    );
    removePrice(500)

  }
  const handleClear=()=>{
    setSelect_city([])
    setSelect_competitors([])
    setSelect_industry([])
    setSelect_market([])
    setSelect_pain([])
    setPrice(0)
    window.location.reload()
  }

  const calculatePrice=(value)=>{
    setPrice(price+value)
    cxtDispatch({type:'SET_PRICE',payload:price+value})
  }
  const removePrice=(value)=>{
    setPrice(price-value)
    cxtDispatch({type:'SET_PRICE',payload:price-value})
  }


  // const handleGenerate=()=>{
  //   navigate("/report-display")
  // }
  useEffect(()=>{
    
    if(select_industry.length===0&&select_city.length===0&&select_market.length===0&&select_pain.length===0&&select_competitors.length===0)
    setGenerate(false)
    else
    setGenerate(true)
  },[select_industry,select_city,select_competitors,select_market,select_pain,price,expandCity,expandCompetitors,expandIndustry,expandPain])
  return (
    <>
    <Navbar reports/>
    {popup&&<div className="nav-popup row">
    <div className="col-md-11 col-sm-10 col-10">
    <p className='container'>Use the Promo code "<strong>RBideas 25</strong>"to get an instant 25% discount during the purchase.Valid till 31st August 2023 
    </p>
    </div>
   <div className="col-md-1 col-sm-1 col-1 icon" style={{fontSize:"20px"}}>
  <img src={wrong} alt="" style={{cursor:"pointer"}} onClick={()=>setPopup(false)}/>
   </div>
   
    </div>}

    <div className='report row'>
      <div className="col-md-4 col-sm-10 col-11 filters">
      <Filters updateIndustry={updateIndustry} updateCity={updateCity} updateCompetitors={updateCompetitors} updateMarket={updateMarket} updatePain={updatePain}
      country={country} setCountry={setCountry} city={city}
      industry={industry} setIndustry={setIndustry} 
      setCity={setCity} competitors={competitors} setCompetitors={setCompetitors} market={market} setMarket={setMarket}
      painpoints={painpoints} setPainpoints={setPainpoints} handleClear={handleClear} select_city={select_city}
      select_competitors={select_competitors} select_industry={select_industry} select_market={select_market} select_pain={select_pain} noSearch={noSearch} setNoSearch={setNoSearch} nogenerate={nogenerate} setNoGenerate={setNoGenerate}
      />
      </div>
      <div className="col-md-8 col-sm-11 col-11">
        <div className="row personalized-report">
          <div className=" col-md-10 personalized-report-left">
           {generate?<HeadingAfter/>:<HeadingBefore/>}
          </div>
           <div className="col-md-2 col-sm-2 col-2 personalized-report-right ms-auto"
           style={{textAlign:'center',justifyContent:'flex-end'}}
           >
            <img src={india} alt="" />
            &nbsp;&nbsp;
            <span>India</span>
           </div>
        </div>
        <div className="row" style={{margin:"auto"}}>
            <div className="col-md-8 col-sm-11 col-11">
              {generate? <p className='after-head'>based on the following selections</p>: <p
    className='before-head'
    >Select the filters for your requirement and we do the rest</p>}
               <div className="all-filters">
                <div className="one-filter">
                  <div className="heading"  onClick={()=>{
                    setIndustry(!industry)
                    setCountry(false)
                    setCity(false)
                    setCompetitors(false)
                    setMarket(false)
                    setPainpoints(false)
                  }}
                  style={{cursor:"pointer",fontFamily: 'Baskerville Old Face'
                }}

                  >
                    Industry&nbsp;&nbsp;&nbsp;
                    {select_industry.length?
                      <span className='text-primary'>({select_industry.length})</span>:
                      <span className='text-muted'>({select_industry.length})</span>
                    }
                    
                  </div>
                  <div className='all-select-filters'>
                  {
                    expandIndustry?
                    select_industry&&select_industry.map((value,index)=>{
                      return(
                        <div>
                        <div className='filter-button ' >
                        <div>
                        {value}
                        </div>
                        <div onClick={()=>removeIndustry(value)}
                        style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}
                        >
                        X
                        </div>
                        </div>
                        </div>
                      )
                    })
                    :
                    select_industry&&select_industry.slice(0,2).map((value,index)=>{
                      return(
                        <div>
                        <div className='filter-button ' >
                        <div>
                        {value}
                        </div>
                        <div onClick={()=>removeIndustry(value)}
                        style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}
                        >
                        X
                        </div>
                        </div>
                        </div>
                      )
                    })
                  }
                  {select_industry.length>2&&<p className='text-primary'  style={{textAlign:"left",cursor:"pointer"}} onClick={()=>setExpandIndustry(!expandIndustry)}><u>+{select_industry.length-2}more</u></p>}

                  </div>
                </div>
               
                <div className="one-filter">
                <div className="heading"    onClick={()=>
                  {
                    setCity(!city)
                    setCountry(false)
                    setCompetitors(false)
                    setMarket(false)
                    setPainpoints(false)
                    setIndustry(false)
                  }
                }
                style={{cursor:"pointer",fontFamily: 'Baskerville Old Face'}}>
                  City&nbsp;&nbsp;&nbsp;
                  {select_city.length?
                    <span className='text-primary'>({select_city.length})</span>:
                    <span className='text-muted'>({select_city.length})</span>
                  }
                  
                </div>
                <div className='all-select-filters'>
                { expandCity?
                  select_city&&select_city.map((value,index)=>{
                    return(
                      <>
                      <div className='filter-button ' >
                      <div>
                      {value}
                      </div>
                      <div onClick={()=>removeCity(value)}
                      style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                      >
                      X
                      </div>
                      </div>
                      </>
                    )
                  }):
                  select_city&&select_city.slice(0,2).map((value,index)=>{
                    return(
                      <>
                      <div className='filter-button ' >
                      <div>
                      {value}
                      </div>
                      <div onClick={()=>removeCity(value)}
                      style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                      >
                      X
                      </div>
                      </div>
                      </>
                    )
                  })
                }
                {select_city.length>2&&<p className='text-primary'  style={{textAlign:"left",cursor:"pointer"}} onClick={()=>setExpandCity(!expandCity)}><u>+{select_city.length-2} more</u></p>}
                </div>
              </div>
              <div className="one-filter">
              <div className="heading"     onClick={()=>
                {setCompetitors(!competitors)
                  setCity(false)
                  setCountry(false)
                  setMarket(false)
                  setPainpoints(false)
                  setIndustry(false)
                }}
              style={{cursor:"pointer",fontFamily: 'Baskerville Old Face'}}>
                List of Competitors&nbsp;&nbsp;&nbsp;
                {select_competitors.length?
                  <span className='text-primary'>({select_competitors.length})</span>:
                  <span className='text-muted'>({select_competitors.length})</span>
                }
                
              </div>
              <div className='all-select-filters'>
              {
                expandCompetitors?
                select_competitors&&select_competitors.map((value,index)=>{
                  return(
                    <>
                    <div className='filter-button ' >
                    <div>
                    {value}
                    </div>
                    <div onClick={()=>removeCompetitors(value)}
                    style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                    >
                    X
                    </div>
                    </div>
                    </>
                  )
                }):
                select_competitors&&select_competitors.slice(0,2).map((value,index)=>{
                  return(
                    <>
                    <div className='filter-button ' >
                    <div>
                    {value}
                    </div>
                    <div onClick={()=>removeCompetitors(value)}
                    style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                    >
                    X
                    </div>
                    </div>
                    </>
                  )
                })
              }
              {select_competitors.length>2&&<p className='text-primary'  style={{textAlign:"left",cursor:"pointer"}} onClick={()=>setExpandCompetitors(!expandCompetitors)}><u>+{select_competitors.length-2} more</u></p>}
              </div>
            </div>
                
            <div className="one-filter">
            <div className="heading"
            onClick={()=>{setMarket(!market)
              setCity(false)
              setCountry(false)
              setCompetitors(false)
              setPainpoints(false)
              setIndustry(false)
            }}            style={{cursor:"pointer",fontFamily: 'Baskerville Old Face'}}
            >
              Market Segment&nbsp;&nbsp;&nbsp;
              {select_market.length?
                <span className='text-primary'>({select_market.length})</span>:
                <span className='text-muted'>({select_market.length})</span>
              }
              
            </div>
            <div className='all-select-filters'>
            {
              expandMarket?
              select_market&&select_market.map((value,index)=>{
                return(
                  <>
                  <div className='filter-button ' >
                  <div>
                  {value}
                  </div>
                  <div onClick={()=>removeMarket(value)}
                  style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                  >
                  X
                  </div>
                  </div>
                  </>
                )
              }):
              select_market&&select_market.slice(0,2).map((value,index)=>{
                return(
                  <>
                  <div className='filter-button ' >
                  <div>
                  {value}
                  </div>
                  <div onClick={()=>removeMarket(value)}
                  style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}                  >
                  X
                  </div>
                  </div>
                  </>
                )
              })
            
            }

            {select_market.length>2&&<p className='text-primary'  style={{textAlign:"left",cursor:"pointer"}} onClick={()=>setExpandMarket(!expandMarket)}><u>+{select_market.length-2} more</u></p>}
            </div>
          </div>
                
          <div className="one-filter">
          <div className="heading"
          onClick={()=>{setPainpoints(!painpoints)
            setCity(false)
            setCountry(false)
            setCompetitors(false)
            setMarket(false)
            setIndustry(false)
          }}
                    style={{cursor:"pointer",fontFamily: 'Baskerville Old Face'}}
          >
            Pain Points&nbsp;&nbsp;&nbsp;
            {select_pain.length?
              <span className='text-primary'>({select_pain.length})</span>:
              <span className='text-muted'>({select_pain.length})</span>
            }
            
          </div>
          <div className='all-select-filters'>
          {
            expandPain?
            select_pain&&select_pain.map((value,index)=>{
              return(
                <>
                <div className='filter-button ' >
                <div>
                {value}
                </div>
                <div onClick={()=>removePain(value)}
                style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}  >
                X
                </div>
                </div>
                </>
              )
            }):
            select_pain&&select_pain.slice(0,2).map((value,index)=>{
              return(
                <>
                <div className='filter-button ' >
                <div>
                {value}
                </div>
                <div onClick={()=>removePain(value)}
                style={{cursor:"pointer",fontSize:"13px",paddingTop:"4px",height:"16px",width:"16px",marginLeft:"8px"}}  >
                X
                </div>
                </div>
                </>
              )
            })
          }
          {select_pain.length>2&&<p className='text-primary'  style={{textAlign:"left",cursor:"pointer"}} onClick={()=>setExpandPain(!expandPain)}><u>+{select_pain.length-2} more</u></p>}
          </div>
        </div>

               </div>
               
            </div>
            <div className="col-md-3 col-sm-11 col-11" style={{margin:"auto"}}>
                <PriceCard price={price}/>
            </div>
            <div className="col-md-1 col-sm-1 col-1"></div>
        </div>
        <div className="row">
        <div className="col-md-8 col-sm-12 col-12 mt-4" style={{alignItems:"center"}}>
          {select_industry.length===0&&select_city.length===0&&select_market.length===0&&select_pain.length===0&&select_competitors.length===0? 
            <>
            <button className='generate-btn' style={{background:" white",color:"black"}} onClick={()=>setNoGenerate(true)} >
            <div className='black-img'>
            <img src={black} alt="" />
            </div> 
            <div>GENERATE REPORT</div>

            </button> 
            </>
:
<>
<button className='generate-btn' style={{background:" #0263c7",color:"white"}} >
<Link to="/report-display"  style={{textDecoration:"none"}}>
<div className='' style={{display:"flex"}}>
     <div className='white-img' >
          <img src={vector} alt="" />
          </div>
          <div className='' style={{color:"white"}}>&nbsp;&nbsp;GENERATE REPORT</div>
          </div>

          </Link>

</button> 
</>

        }       
        </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Reports

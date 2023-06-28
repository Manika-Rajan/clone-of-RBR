import React, { useEffect, useState } from 'react'
import './Filters.css'
import './Reports.css'
import search from '../assets/search.svg'
import close from '../assets/close.svg'
const Filters = ({updateIndustry,updateMarket,updateCity,updateCompetitors,updatePain,country,setCountry,
industry,setIndustry,setCity,city,competitors,setCompetitors,market,setMarket,painpoints,setPainpoints,handleClear,select_industry,select_city,select_market,select_competitors,select_pain,noSearch,setNoSearch,nogenerate,setNoGenerate
}) => {
const industry_data=[
{name:'Agriculture &Allied Activities'},
{name:'Construction'},
{name:'Manufacturing'},
{name: 'Electricity Companies'},
{name:'Mining'},
{name:'Business Services'},
{name:'Community,Sociall and Personal Services'},
{name:'Real Estate and Rentining'},
{name:'Trading'},
{name:'Transport'},
{name:'Finance'},
{name:'Insurance'},
{name:'Gas Companies'},
{name:'Water Companies'},
{name:'Quarrying'},
{name:'Storage'},
{name:'Communications'}
]
const city_data=[
  {name:'Chattisgarh'},
  {name:'Bihar'},
  {name:'Maharashtra'},
  {name:'Pondicherry'},
  {name:'Uttarakhand'},
  {name:'West Bengal'},
  {name:'Karnataka'},
  {name:'Chandigarh'},
  {name:'Tamil Nadu'},
  {name:'Delhi'},
  {name:'Gujarat'},
  {name:'Telangana'},
  {name:'Madhya Pradesh'},
  {name:'Kerala'},
  {name:'Punjab'},
  {name:'Uttar Pradesh'},
  {name:'Himachal Pradesh'},
  {name:'Haryana'},
  {name:'Rajasthan'},
  {name:'Andhra Pradesh'},
  {name:'Orissa'},
  {name:'Goa'},
  {name:'Jharkhand'},
  {name:'Assam'},
  {name:'Tripura'},
  {name:'Jammu & Kashmir'},
  {name:'Manipur'},
]
const competitors_data=[
  {name:' India wide '},
  {name:' Andhra Pradesh'},
  {name:' Telangana'},
  {name:' Karnataka'},
  {name:'  West Bengal'},
  {name:' Delhi  '},
  {name:' Maharashtra  '},
]
const market_data=[
  {name:'  less than 5  '},
  {name:' 5 to 15  '},
  {name:' 15 to 25  '},
  {name:' 25 to 40  '},
  {name:' All of the Above  '},
]

const pain_data=[
  {name:'  Availability of Product  '},
  {name:' Price of Product  '},
  {name:' Quality of Products in Market  '},
  {name:' Supply of Product not Adequate  '},

]
const [industryList,setIndustryList]=useState(industry_data)
const [industryField,setIndustryField]=useState("")
const [cityList,setCityList]=useState(city_data)
const [cityField,setCityField]=useState("")
const [mainField,setMainField]=useState("")
const [competitorList,setCompetitorList]=useState(competitors_data)
const [marketList,setMarketList]=useState(market_data)
const [painpointsList,setPainpointsList]=useState(pain_data)
const handleIndustry=(e)=>{
   const {value,checked}=e.target
   updateIndustry(value,checked)    
}
const handleCity=(e)=>{
  const {value,checked}=e.target
  updateCity(value,checked)
}
const handleCompetitors=(e)=>{
  const {value,checked}=e.target
  updateCompetitors(value,checked)
}
const handleMarket=(e)=>{
  const {value,checked}=e.target
  updateMarket(value,checked)
}
const handlePain=(e)=>{
  const {value,checked}=e.target
  updatePain(value,checked)

}
const handleIndustrySearch=(e)=>{
  const searchField=e.target.value;
  setIndustryField(searchField)
  console.log(searchField)
  const searchIndustry=industry_data.filter(
    item => {
      return (
        item
        .name
        .toLowerCase()
        .includes(searchField.toLowerCase()) 
      );
    }
  );
  setIndustryList(searchIndustry)
}
const handleCitySearch=(e)=>{
  const searchField=e.target.value;
  setCityField(searchField)
  console.log(searchField)
  const searchCity=city_data.filter(
    item => {
      return (
        item
        .name
        .toLowerCase()
        .includes(searchField.toLowerCase()) 
      );
    }
  );
  setCityList(searchCity)
}

const handleMainSearch=(e)=>{
  const serchField=e.target.value
  setMainField(serchField)
  
}

  return (
    <div className='sidebar'>
    
      <div className="accordion2">
        <div className="accordion-item2">
        <div style={{display:"flex",padding:"10px 32px"}}>
        <input type='text' placeholder='What are you looking for?' className='search-input text-primary' style={{borderRadius:"20px",paddingLeft:"20px"}}/>
        <img src={search} style={{marginLeft:"-10%",marginBottom:"6%"}}></img>
        </div>
        </div>
      </div>
      {nogenerate&&
        <div className="accordion2">
        <div className="accordion-item2">
        <div className='row' style={{display:"flex",margin:"5px 32px",padding:"10px 16px", border:"1px solid #0263c7",borderRadius:"10px"}}>
          <div className='col-md-11'>
          <p className='search-desc'>Please select options from the <strong>"Filters Panel"</strong> we have specially crafted for you.</p>
          </div>
          <div className='col-md-1'>
          <img src={close} alt=""style={{color:"black",cursor:"pointer"}} onClick={()=>setNoGenerate(false)}/>
          </div>
        </div>
        </div>
      </div>
        }
     { 
      noSearch&&
      <div className="accordion2">
      <div className="accordion-item2">
      <div className='row' style={{display:"flex",margin:"5px 32px",padding:"10px 16px", border:"1px solid #0263c7",borderRadius:"10px"}}>
        <div className='col-md-11'>
        <p className='search-desc'>No matches found.<br/>Please select options from the <strong>"Filters Panel"</strong> we have specially crafted for you.</p>
        </div>
        <div className='col-md-1'>
        <img src={close} alt=""style={{color:"black",cursor:"pointer"}} onClick={()=>setNoSearch(false)}/>
        </div>
      </div>
      </div>
    </div>
  }



       <div className="accordion2">
        <div className="accordion-item2">
          <div className="accordion-title2">
            <div>Filter</div>
            {select_industry.length===0&&select_city.length===0&&select_market.length===0&&select_pain.length===0&&select_competitors.length===0? <p className='text-muted clear'>CLEAR ALL</p>
:            <p className='text-primary clear' onClick={handleClear}>CLEAR ALL</p>
}
          </div>
        </div>
      </div>
      {/* country */}
       <div className="accordion1">
        <div className="accordion-item1">
          <div className="accordion-title1"   onClick={()=>{
            setCountry(!country)
             setCity(false)
             setCompetitors(false)
             setMarket(false)
             setPainpoints(false)
             setIndustry(false)
          }} style={{cursor:"pointer"}}>
            <div> Country</div>
            <div style={{color:"#0263c7",fontWeight:"800"}}
          
            >{country? <>-</>:<>+</>}</div>
{/*    <h1>hello</h1> */}
          
                  </div>
          {country&&<div className="accordion-content1">
              <form>
              <div class="form-check">
              <input class="form-check-input" type="radio" name="country" id="country"  checked="checked"/>
              <label class="form-check-label" for="country">
                India
              </label>
            </div>
            <div class="form-check">
          <input class="form-check-input" type="radio" name="country" id="country"/>
          <label class="form-check-label" for="country">
            South Africa
          </label>
        </div>
              </form>
          </div>
}
        </div>
      </div>
     {/* industry */}
     <div className="accordion1">
        <div className="accordion-item1">
          <div className="accordion-title1"
          onClick={()=>{
            setIndustry(!industry)
            setCountry(false)
            setCity(false)
            setCompetitors(false)
            setMarket(false)
            setPainpoints(false)
          }}
          style={{cursor:"pointer"}}
          >
            <div >Industry</div>
            <div style={{color:"#0263c7",fontWeight:"800"}}
          
            >{industry?<>-</>:<>+</>}</div>
          </div>
          {industry&&<div className="accordion-content1">
          <form>
          <div style={{display:"flex"}}>
          <input type='text'  value={industryField} placeholder='Search'className='search-input' onChange={handleIndustrySearch} name="industryField" />
          <img src={search} style={{marginLeft:"-6%",marginBottom:"5%"}}></img>
          </div>
          
          <br/>
          {
            industryList&&industryList.map((ind,key)=>{
              return(
                 <>
                 <div class="form-check">
                 <input class={`form-check-input ind-${key}`} type="checkbox" value={ind.name} name={ind.name} id={`ind-${key}`} onChange={handleIndustry}/>
                 <label class="form-check-label ind-${key}" style={{paddingTop:"3px" ,}} for={`ind-${key}`} >
                   {ind.name}
                 </label>
               </div>
                
                 </>
              )
            })
          }
          </form>
          </div>}
        </div>
      </div>
    {/* city */}
        <div className="accordion1">
      <div className="accordion-item1">
      <div className="accordion-title1"
      onClick={()=>
        {
          setCity(!city)
          setCountry(false)
          setCompetitors(false)
          setMarket(false)
          setPainpoints(false)
          setIndustry(false)
        }
        }
        style={{cursor:"pointer"}}
      >
      <div>City(where business will setup)</div>
      <div style={{color:"#0263c7",fontWeight:"800"}}
     
      >{city?<>-</>:<>+</>}</div>
    </div>
        {city&&          <div className="accordion-content1">
        <form>
          <div style={{display:"flex"}}>
          <input type='text'  value={cityField}placeholder='Search'className='search-input' onChange={handleCitySearch} name="cityField" />
          <img src={search} style={{marginLeft:"-6%",marginBottom:"5%"}}></img>
          </div>
        {
          cityList&&cityList.map((ind,key)=>{
            return(
               <>
               <div class="form-check">
               <input class="form-check-input" type="checkbox" value={ind.name} name={ind.name} id={`ind-${key}`} onChange={handleCity}/>
               <label class="form-check-label" for={`ind-${key}`} style={{paddingTop:"3px"}}>
                 {ind.name}
               </label>
             </div>
              
               </>
            )
          })
        }
        </form>
        </div>}
      </div>
    </div>
{/* competitors */}
  <div className="accordion1">
        <div className="accordion-item1">
          <div className="accordion-title1"
          onClick={()=>
            {setCompetitors(!competitors)
              setCity(false)
              setCountry(false)
              setMarket(false)
              setPainpoints(false)
              setIndustry(false)
            }}
           style={{cursor:"pointer"}} 
            >
            <div>List of Competitors</div>
            <div style={{color:"#0263c7",fontWeight:"800"}}
           
            >{competitors?<>-</>:<>+</>}</div>
          </div>
          {competitors&&<div className="accordion-content1">
          <form>
      
          {
            competitorList&&competitorList.map((ind,key)=>{
              return(
                 <>
                 <div class="form-check">
                 <input class="form-check-input" type="checkbox" value={ind.name} name={ind.name} id={`ind-${key}`} onChange={handleCompetitors}/>
                 <label class="form-check-label" for={`ind-${key}`} style={{paddingTop:"3px"}}>
                   {ind.name}
                 </label>
               </div>
                
                 </>
              )
            })
          }
          </form>
          </div>
          }
        </div>
      </div>
      {/* market */}
      <div className="accordion1">
        <div className="accordion-item1">
          <div className="accordion-title1"
          onClick={()=>{setMarket(!market)
            setCity(false)
            setCountry(false)
            setCompetitors(false)
            setPainpoints(false)
            setIndustry(false)
          }}
          style={{cursor:"pointer"}}
          >
            <div>Market Segment(Age wise)</div>
            <div style={{color:"#0263c7",fontWeight:"800"}}
            
            >{market?<>-</>:<>+</>}</div>
          </div>
          {market&&          <div className="accordion-content1">
          <form>
      
          {
            marketList&&marketList.map((ind,key)=>{
              return(
                 <>
                 <div class="form-check">
                 <input class="form-check-input" type="checkbox" value={ind.name} name={ind.name} id={`ind-${key}`} onChange={handleMarket}/>
                 <label class="form-check-label" for={`ind-${key}`} style={{paddingTop:"3px"}}>
                   {ind.name}
                 </label>
               </div>
                
                 </>
              )
            })
          }
          </form>
          
          </div>
}
        </div>
      </div>
        {/* pain points */}
        <div className="accordion1">
        <div className="accordion-item1">
          <div className="accordion-title1"
          onClick={()=>{setPainpoints(!painpoints)
            setCity(false)
            setCountry(false)
            setCompetitors(false)
            setMarket(false)
            setIndustry(false)
          }}
          style={{cursor:"pointer"}}
          >
            <div>Existing industry's Customer Pain Points</div>
            <div style={{color:"#0263c7",fontWeight:"800"}}
           
            >{painpoints?<>-</>:<>+</>}</div>
          </div>
          {painpoints&&          <div className="accordion-content1">
          <form>
      
          {
            painpointsList&&painpointsList.map((ind,key)=>{
              return(
                 <>
                 <div class="form-check">
                 <input class="form-check-input" type="checkbox" value={ind.name} name={ind.name} id={`ind-${key}`} onChange={handlePain}/>
                 <label class="form-check-label" for={`ind-${key}`} style={{paddingTop:"3px"}}>
                   {ind.name}
                 </label>
               </div>
                
                 </>
              )
            })
          }
          </form>
          </div>}
        </div>
      </div>

     
      
    </div>
  )
}

export default Filters

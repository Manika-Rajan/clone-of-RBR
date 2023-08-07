import React from 'react'
import Navbar from './Navbar'
import './About.css'
import one from '../assets/one.svg';
import two from '../assets/two.png';
import three from '../assets/three.svg';
import four from '../assets/four.svg';
import line from '../assets/line.svg';
import step1 from '../assets/step1.svg';
import step2 from '../assets/step2.svg';
import step3 from '../assets/step3.svg';
import  team1 from '../assets/team1.png';
import team2 from '../assets/team2.png';
import team3 from '../assets/team3.png';
import team4 from '../assets/team4.jpg';
const About = () => {
  return (
    <div>
      <Navbar about/>
     <div className='row' style={{padding:"2% 4%"}}>
     <div className='col-md-5 col-sm-12 col-12' style={{marginLeft:"2%"}}>
     <p className='text-primary' style={{fontSize:"16px",fontWeight:"600"}}>At Rajan Business Reports. We help you build your business with ease.</p>
     <p className='about-text'>
     Rajan Business Reports is an initiative of Rajan Business Ideas.
     </p>
<p className='about-text'>
Rajan Business Reports was launched with a sole objective of helping the entrepreneurs to acquire the relevant data to get their business idea evaluated and find the probability of success in the current market scenario.
</p>
<p className='about-text'>
It has been observed that every year only 8% of the startups are able to sustain in India, and the remaining startups are shut down after a few months, there are several factors that lead to the failure of these startups. Our expert team at Rajan Business Reports continuously monitors the startup scenario in India and continuously improve the Business Reports that we offer depending on the current business market scenario.
     </p>
     </div>
     <div className='col-md-6 col-sm-12 col-12 about-left'>
     <div >
     <img src={one} className='image-one'></img>
     </div>
     <div >
     <img src={two} className='image-two'></img>
     </div>
     <div >
     <img src={four} className='image-three'></img>
     </div>
     <div >
     <img src={three} className='image-four'></img>
     </div>
     </div>
     </div>
     <div className='row' style={{padding:"0% 8%"}}>
     <img src={line}></img>
     </div>
     <div className='row what-we-do head'>
      <p >What We Do?</p>
     </div>
     <div className='row' style={{padding:"5% 9%"}}>
     <div className='col-md-4 col-sm-12 col-12 '>
     <div className='steps mb-4'>
     <div className='step-image'>
     <img src={step3}/>
     </div>
      <p className='step-head'>Research</p>
      <p className='step-desc'>We research and collect Market Information from both Online and Offline sources.</p>
     </div>
     </div>
     <div className='col-md-4 col-sm-12 col-12' >
     <div className='steps mb-4'>
     <div className='step-image'>
     <img src={step2}/>
     </div>
      <p className='step-head'>Assemble</p>
      <p className='step-desc'>We assemble the huge database with the “Get your Report” Tool that is accessible at Rajanbusinessreports.in</p>
     </div>
     </div>
     <div className='col-md-4 col-sm-12 col-12 '>
     <div className='steps mb-4'>
     <div className='step-image'>
     <img src={step1}/>
     </div>
      <p className='step-head'>Present</p>
      <p className='step-desc'>The “Get your Report” Tool automatically presents the data in a presentable document for you. </p>
     </div>
     </div>
     </div>
     <div className='line-div'></div>
     <div className='row what-we-do head'>
      <p >Meet Our Team.The Professionals!</p>
     </div>
     <div className='d-flex justify-content-between team-div'>
      <div className='team'>
      <div className='team-image'>
      <img src={team3}></img>
      </div>
      <div className='team-info'>
      <p><strong>R.Manika Rajan</strong><br/>Founder & Proprietor     </p>

      </div>
     </div>
     <div className='team'>
     <div className='team-image'>
     <img src={team2}></img>
     </div>
     <div className='team-info'>
     <p><strong>Akrati Rawat</strong><br/>UI/UX Designer</p>
    
     </div>
    </div>
    <div className='team'>
    <div className='team-image'>
    <img src={team1}></img>
    </div>
    <div className='team-info'>
    <p><strong>Pothala Jahnavi</strong><br/>Frontend Developer</p>
    
    </div>
   </div>
   <div className='team'>
     <div className='team-image'>
     <img src={team4} style={{width:"85%",borderRadius:"45%"}}></img>
     </div>
     <div className='team-info'>
     <p><strong>Srusti S Joshi</strong><br/>Backend Developer</p>
    
     </div>
    </div>
     </div>
     </div>
  )
}

export default About

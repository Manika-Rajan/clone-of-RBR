import './App.css';
import About from './components/About';
import Contact from './components/Contact';
import Navbar from './components/Navbar';
import Reports from './components/Reports';
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import ReportsDisplay from './components/ReportsDisplay';
import Payment from './components/Payment';
import Footer from './components/Footer'
import CommingSoon from './components/CommingSoon';
import Invalid from './components/Invalid';
import Login from './components/Login';
import { useState } from 'react';

function App() {
const [login, setLogin] = useState(false); // Login form hidden by default
  const [otpSent, setOtpSent] = useState(false); // OTP input hidden by default
  const [verify, setVerify] = useState(false); // User not verified by default

  // Trigger login when "Buy Now" is clicked
  const handleBuyNow = () => {
    if (!verify) {
      setLogin(true); // Show login if not verified
    }
  };

  // Close login popup when clicking outside
  const handleLoginClose = (e) => {
    if (e.target.className === 'login-popup-container') {
      setLogin(false);
      setOtpSent(false);
    }
  };
  
  return (
    <BrowserRouter>
    <div className="App">
        {/* Navbar on all pages except /report-display */}
        <Routes>
          <Route path="/report-display" element={null} />
          <Route path="*" element={<Navbar />} />
        </Routes>

        {/* Login overlay with outside-click-to-close */}
        {login || otpSent ? (
          <div className="login-popup-container" onClick={handleLoginClose}>
            <Login sendOtp={setOtpSent} setLogin={setLogin} setVerify={setVerify} />
          </div>
        ) : null}
    
         <Routes>
        <Route path="/about" element={<About/>} />
        <Route path="/" element={<Reports/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/report-display' element={<ReportsDisplay/>}/>
        <Route path='/payment' element={<Payment/>}/>
        <Route path='/commingSoon' element={<CommingSoon/>} />
        <Route path='/not-found' element={<Invalid/>} />
      </Routes>
      <Footer/>
    </div>
    </BrowserRouter>
  );
}

export default App;

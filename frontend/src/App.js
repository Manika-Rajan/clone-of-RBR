import './App.css';
import About from './components/About';
import Contact from './components/Contact';
import Navbar from './components/Navbar';
import Reports from './components/Reports';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReportsDisplay from './components/ReportsDisplay';
import Payment from './components/Payment';
import Footer from './components/Footer';
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

  // Reset login states after closing
  const handleLoginClose = () => {
    setLogin(false);
    setOtpSent(false);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar /> {/* Added as it was imported in original */}
        {login || otpSent ? (
          <Login
            sendOtp={setOtpSent}
            setLogin={setLogin}
            setVerify={setVerify}
            onClose={handleLoginClose}
          />
        ) : null}
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/" element={<Reports onBuyNow={handleBuyNow} verify={verify} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/report-display" element={<ReportsDisplay onBuyNow={handleBuyNow} verify={verify} />} />
          <Route path="/payment" element={verify ? <Payment /> : <Navigate to="/" />} />
          <Route path="/commingSoon" element={<CommingSoon />} />
          <Route path="/not-found" element={<Invalid />} />
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

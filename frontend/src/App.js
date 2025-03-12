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
import ProfilePage from './components/ProfilePage';
import Login from './components/Login';
import { useState } from 'react';

function App() {
  const [login, setLogin] = useState(false); // Login form hidden by default
  const [otpSent, setOtpSent] = useState(false); // OTP input hidden by default
  const [verify, setVerify] = useState(false); // User not verified by default

  // Function to trigger login when "Buy Now" is clicked
  const handleBuyNow = () => {
    if (!verify) {
      setLogin(true); // Show login if not verified
    }
  };

  // Reset login states after verification or cancellation
  const handleLoginClose = () => {
    setLogin(false);
    setOtpSent(false);
  };

  return (
    <BrowserRouter>
      <div className="App">
        {/* Navbar on all pages except ReportsDisplay */}
        <Routes>
          <Route path="/report-display" element={null} /> {/* No Navbar */}
          <Route path="*" element={<Navbar />} /> {/* Navbar everywhere else */}
        </Routes>

        {/* Login overlay */}
        {login || otpSent ? (
          <Login
            sendOtp={setOtpSent}
            setLogin={setLogin}
            setVerify={setVerify}
            onClose={handleLoginClose}
          />
        ) : null}

        <Routes>
          {/* Public Routes - Accessible without login */}
          <Route path="/" element={<Reports onBuyNow={handleBuyNow} verify={verify} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/report-display"
            element={<ReportsDisplay onBuyNow={handleBuyNow} verify={verify} />}
          />
          <Route path="/commingSoon" element={<CommingSoon />} />
          <Route path="/not-found" element={<Invalid />} />

          {/* Protected Routes - Require Verification */}
          <Route
            path="/payment"
            element={
              verify ? <Payment /> : <Navigate to="/" /> // Redirect to landing if not verified
            }
          />
          <Route
            path="/profile"
            element={
              verify ? <ProfilePage /> : <Navigate to="/" /> // Redirect to landing if not verified
            }
          />

          {/* Redirect unmatched routes */}
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

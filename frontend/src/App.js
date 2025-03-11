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
import Login from './components/Login'; // Assuming Login.jsx is in components/
import { useState } from 'react';

function App() {
  const [login, setLogin] = useState(true); // Show login form initially
  const [otpSent, setOtpSent] = useState(false); // Show OTP input after sending
  const [verify, setVerify] = useState(false); // User is verified/logged in

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar /> {/* Added Navbar for consistency */}
        <Routes>
          {/* Public Routes */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/commingSoon" element={<CommingSoon />} />
          <Route path="/not-found" element={<Invalid />} />

          {/* Protected Routes - Require Verification */}
          <Route
            path="/"
            element={
              verify ? <Reports /> : <Login sendOtp={setOtpSent} setLogin={setLogin} setVerify={setVerify} />
            }
          />
          <Route
            path="/report-display"
            element={
              verify ? (
                <ReportsDisplay />
              ) : (
                <Login sendOtp={setOtpSent} setLogin={setLogin} setVerify={setVerify} />
              )
            }
          />
          <Route
            path="/payment"
            element={
              verify ? <Payment /> : <Login sendOtp={setOtpSent} setLogin={setLogin} setVerify={setVerify} />
            }
          />
          <Route
            path="/profile"
            element={
              verify ? <ProfilePage /> : <Login sendOtp={setOtpSent} setLogin={setLogin} setVerify={setVerify} />
            }
          />

          {/* Redirect any unmatched route to /not-found */}
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

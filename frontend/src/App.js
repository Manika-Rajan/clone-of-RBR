import './App.css';
import About from './components/About';
import Contact from './components/Contact';
import TermsAndConditions from './components/TermsAndConditions';
import Navbar from './components/Navbar';
import Reports from './components/Reports';
//import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import ReportsDisplay from './components/ReportsDisplay';
import Payment from './components/Payment';
import Footer from './components/Footer';
import CommingSoon from './components/CommingSoon';
import Invalid from './components/Invalid';
import RefundPolicy from './components/RefundPolicy'; 
import PrivacyPolicy from './components/PrivacyPolicy'; 
import React, { useEffect, useContext } from 'react';
import { Store } from './Store';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';


function App() {
  const { state, dispatch } = useContext(Store);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token && !state.isLogin) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            const response = await fetch(
              'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
              }
            );
            const data = await response.json();
            if (response.ok && data.name && data.email) {
              dispatch({ type: 'USER_LOGIN', payload: { isLogin: true, userId } });
              dispatch({ type: 'SET_NAME', payload: data.name });
              dispatch({ type: 'SET_EMAIL', payload: data.email });
              dispatch({ type: 'SET_PHONE', payload: userId });
            }
          } catch (error) {
            console.error('Auth check error:', error);
          }
        }
      }
    };
    checkAuth();
  }, [state.isLogin, dispatch]);
    
  return (
    <BrowserRouter>
      <div className="App">
        {/* Navbar on all pages except /report-display */}
        {window.location.pathname !== "/report-display" && <Navbar />}
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/" element={<Reports />} />
          <Route path='/contact' element={<Contact />} />
          //<Route path='/report-display' element={<ReportsDisplay />} />
          //<Route path='/payment' element={<Payment />} />
          <Route path='/commingSoon' element={<CommingSoon />} />
          <Route path='/not-found' element={<Invalid />} />
          //<Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={state.isLogin ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/payment" element={state.isLogin ? <Payment /> : <Navigate to="/login" />} />
          <Route path="/report-display" element={state.isLogin ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

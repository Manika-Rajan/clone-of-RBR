import './App.css';
import About from './components/About';
import Contact from './components/Contact';
import TermsAndConditions from './components/TermsAndConditions';
import Navbar from './components/Navbar';
import Reports from './components/Reports';
import ProfilePage from './components/ProfilePage';
import ReportsDisplay from './components/ReportsDisplay';
import Payment from './components/Payment';
import Footer from './components/Footer';
import CommingSoon from './components/CommingSoon';
import Careers from './components/Career';
import Invalid from './components/Invalid';
import RefundPolicy from './components/RefundPolicy'; 
import PrivacyPolicy from './components/PrivacyPolicy'; 
import Partner from './components/Partner';
import React from 'react';
import { StoreProvider, useStore } from './Store';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();

  const hideNavbarRoutes = ["/report-display", "/payment"];

  return (
    <div className="App">
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
        
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Reports />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/report-display' element={<ReportsDisplay />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/partner" element={<Partner />} />
        <Route path='/payment' element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } />
        <Route path='/commingSoon' element={<CommingSoon />} />
        <Route path='/not-found' element={<Invalid />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/not-found" />} /> {/* Catch-all */}
      </Routes>
      <Footer />
    </div>
  );
}

// ✅ Protected Route Component (surgical fix applied)
const ProtectedRoute = ({ children }) => {
  const { state } = useStore();
  const { userInfo } = state;
  const isLogin = userInfo?.isLogin || false;

  const location = useLocation();
  const navState = location.state;

  // Allow access if logged in via store OR passed via navigate state
  if (isLogin || navState?.loggedIn) {
    return children;
  }

  return <Navigate to="/" state={{ from: location }} replace />;
};

function App() {
  return (
    <StoreProvider>
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
}

export default App;

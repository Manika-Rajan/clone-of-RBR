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
import Invalid from './components/Invalid';
import RefundPolicy from './components/RefundPolicy'; 
import PrivacyPolicy from './components/PrivacyPolicy'; 
import React from 'react';
import { StoreProvider } from './Store';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './Store'; // Ensure this import is present

function AppContent() {
  const location = useLocation();
  const { state } = useStore();
  const { userInfo } = state;
  const isLogin = userInfo?.isLogin || false;

  return (
    <div className="App">
      {location.pathname !== "/report-display" && <Navbar />}
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Reports />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/report-display' element={<ReportsDisplay />} />
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
        <Route path="*" element={<Navigate to="/not-found" />} /> {/* Catch-all without /login route */}
      </Routes>
      <Footer />
    </div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { state } = useStore();
  const { userInfo } = state;
  const isLogin = userInfo?.isLogin || false;
  const location = useLocation();

  return isLogin ? children : <Navigate to="/" state={{ from: location }} replace />; // Redirect to home instead of /login
};

function App() {
  return (
    <StoreProvider key={Date.now()}> {/* Force re-render on mount */}
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
}

export default App;

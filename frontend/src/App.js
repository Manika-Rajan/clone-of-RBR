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
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import { useStore } from './Store'; // Ensure this import is present

function App() {
  return (
    <StoreProvider key={Date.now()}> {/* Force re-render on mount */} {/* This wraps everything, making Store available to all components */}
      <Router>
        <div className="App">
          {window.location.pathname !== "/report-display" && <Navbar />}
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/" element={<Reports />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/report-display' element={<ReportsDisplay />} />
            <Route path='/payment' element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path='/commingSoon' element={<CommingSoon />} />
            <Route path='/not-found' element={<Invalid />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="*" element={<div>404 - Not Found</div>} /> {/* Catch-all for /not-found */}
          </Routes>
          <Footer />
        </div>
      </Router>
    </StoreProvider>
  );
}

// Protected Route Component (checks if user is logged in)
const ProtectedRoute = ({ children }) => {
  const { state } = useStore(); // Safely access Store within StoreProvider
  const { userInfo } = state;
  const isLogin = userInfo?.isLogin || false;

  return isLogin ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <StoreProvider key={Date.now()}> {/* Force re-render on mount */}
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
};

export default App;

import "./App.css";
import About from "./components/About";
import Contact from "./components/Contact";
import TermsAndConditions from "./components/TermsAndConditions";
import Navbar from "./components/Navbar";
import Reports from "./components/Reports";
import ReportsMobile from "./components/ReportsMobile";
import { isMobile } from "react-device-detect";
import ProfilePage from "./components/ProfilePage";
import ProfilePageMobile from "./components/ProfilePageMobile";
import ReportsDisplay from "./components/ReportsDisplay";
import Payment from "./components/Payment";
import PaymentMobile from "./components/PaymentMobile";
import Footer from "./components/Footer";
import CommingSoon from "./components/CommingSoon";
import Careers from "./components/Career";
import Invalid from "./components/Invalid";
import RefundPolicy from "./components/RefundPolicy";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Partner from "./components/Partner";
import React from "react";
import { StoreProvider, useStore } from "./Store";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ReportsDisplayMobile from "./components/ReportsDisplayMobile";
import PurchaseSuccess from "./components/PurchaseSuccess";
import ReportRequestsDashboard from "./components/ReportRequestsDashboard";
import PrebookSuccess from "./components/PrebookSuccess";

function AppContent() {
  const location = useLocation();

  const hideNavbarRoutes = ["/report-display", "/payment"];
  const ReportDisplayResponsive = () =>
    isMobile ? <ReportsDisplayMobile /> : <ReportsDisplay />;

  // ✅ ProtectedRoute moved INSIDE Router context + made null-safe
  const ProtectedRoute = ({ children }) => {
    const store = useStore?.();
    const state = store?.state;
    const userInfo = state?.userInfo;

    const isLogin = userInfo?.isLogin || false;
    const navState = location.state;

    if (isLogin || navState?.loggedIn) return children;

    return <Navigate to="/" state={{ from: location }} replace />;
  };

  return (
    <div className="App">
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}

      <Routes>
        <Route path="/about" element={<About />} />

        <Route path="/" element={isMobile ? <ReportsMobile /> : <Reports />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/report-display" element={<ReportDisplayResponsive />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/partner" element={<Partner />} />

        <Route
          path="/analytics"
          element={
            <PrivateRoute roleRequired="admin">
              <AnalyticsDashboard />
            </PrivateRoute>
          }
        />

        <Route path="/team/report-requests" element={<ReportRequestsDashboard />} />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              {isMobile ? <PaymentMobile /> : <Payment />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-success"
          element={
            <ProtectedRoute>
              <PurchaseSuccess />
            </ProtectedRoute>
          }
        />

        <Route path="/prebook-success" element={<PrebookSuccess />} />

        <Route path="/commingSoon" element={<CommingSoon />} />
        <Route path="/not-found" element={<Invalid />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {isMobile ? <ProfilePageMobile /> : <ProfilePage />}
            </ProtectedRoute>
          }
        />

        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route path="*" element={<Navigate to="/not-found" />} />
      </Routes>

      <Footer />
    </div>
  );
}

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

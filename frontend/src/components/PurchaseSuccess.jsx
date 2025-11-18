// RBR/frontend/src/components/PurchaseSuccess.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { triggerRbrPurchaseConversion } from "./googleAdsConversion";

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If you ever pass amount as a query param (?amount=2249), we’ll use it
  const searchParams = new URLSearchParams(location.search);
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? Number(amountParam) : 2249;

  useEffect(() => {
    // Fire Google Ads purchase conversion once on page load
    triggerRbrPurchaseConversion(amount);

    // Auto-redirect to My Profile after a few seconds
    const timer = setTimeout(() => {
      navigate("/profile"); // 🔁 update if your My Profile route is different
    }, 5000);

    return () => clearTimeout(timer);
  }, [amount, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px 20px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "999px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ecfdf3",
          }}
        >
          <span style={{ fontSize: "32px" }}>✅</span>
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "#0f172a",
          }}
        >
          Payment successful!
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#475569",
            marginBottom: "16px",
          }}
        >
          Thank you for purchasing an{" "}
          <strong>RBR market / industry report</strong>.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "20px",
          }}
        >
          Your report is now available under{" "}
          <strong>“Purchased Reports”</strong> in your{" "}
          <strong>My Profile</strong> page.
        </p>

        <button
          onClick={() => navigate("/profile")} // 🔁 change if needed
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "999px",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            background:
              "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)",
            color: "#ffffff",
          }}
        >
          Go to My Profile → Purchased Reports
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "9px 14px",
            borderRadius: "999px",
            border: "1px solid #e2e8f0",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            background: "#ffffff",
            color: "#475569",
          }}
        >
          Back to Home
        </button>

        <p
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginTop: "12px",
          }}
        >
          You’ll be redirected automatically to My Profile in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default PurchaseSuccess;

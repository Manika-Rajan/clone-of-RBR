import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PrebookSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const s = location.state || {};

  const {
    prebookId,
    reportTitle,
    userPhone,
    userName,
    amount,
    currency,
    confirmOk,
    razorpayPaymentId,
  } = s;

  const amountINR = useMemo(() => {
    // Your prebook API returns amount in paise in most setups.
    // If it is already 499, it will still render fine.
    if (typeof amount === "number" && amount > 1000) return Math.round(amount / 100);
    if (typeof amount === "string" && Number(amount) > 1000) return Math.round(Number(amount) / 100);
    return Number(amount) || 499;
  }, [amount]);

  useEffect(() => {
    // Redirect after 6 seconds (slightly longer than purchase page)
    const t = setTimeout(() => navigate("/", { replace: true }), 6000);
    return () => clearTimeout(t);
  }, [navigate]);

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
          maxWidth: "520px",
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

        <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px", color: "#0f172a" }}>
          Prebooking confirmed!
        </h1>

        <p style={{ fontSize: "15px", color: "#475569", marginBottom: "10px" }}>
          Thank you for trusting <strong>Rajan Business Reports</strong>.
        </p>

        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "14px" }}>
          Amount paid: <strong>₹{amountINR}</strong> {currency ? <span>({currency})</span> : null}
        </div>

        {reportTitle && (
          <div style={{ fontSize: "13px", color: "#334155", marginBottom: "10px" }}>
            Topic: <strong>{reportTitle}</strong>
          </div>
        )}

        {/* IDs */}
        {(prebookId || razorpayPaymentId) && (
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
            {prebookId ? (
              <div>
                Prebook ID: <strong>{prebookId}</strong>
              </div>
            ) : null}
            {razorpayPaymentId ? (
              <div>
                Payment ID: <strong>{razorpayPaymentId}</strong>
              </div>
            ) : null}
          </div>
        )}

        {/* Confirmation status */}
        <div
          style={{
            margin: "0 auto 16px",
            padding: "10px 12px",
            borderRadius: "12px",
            background: confirmOk === false ? "#fff7ed" : "#f1f5f9",
            border: confirmOk === false ? "1px solid #fdba74" : "1px solid #e2e8f0",
            textAlign: "left",
          }}
        >
          {confirmOk === false ? (
            <>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#9a3412" }}>
                Payment received — confirmation pending
              </div>
              <div style={{ fontSize: "12px", color: "#7c2d12", marginTop: "4px" }}>
                Don’t worry. Your payment is successful. Our system will confirm it shortly and your prebooking will be processed.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                What happens next
              </div>
              <ul style={{ marginTop: "6px", marginLeft: "16px", fontSize: "12px", color: "#475569" }}>
                <li>Our analyst team starts preparing your report.</li>
                <li>Expected delivery: <strong>2 working days</strong>.</li>
                <li>We will update you on WhatsApp{userPhone ? ` (${userPhone})` : ""}.</li>
              </ul>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/", { replace: true })}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "999px",
            border: "none",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            background:
              "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)",
            color: "#ffffff",
          }}
        >
          Back to Home
        </button>

        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px" }}>
          You’ll be redirected automatically in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default PrebookSuccess;

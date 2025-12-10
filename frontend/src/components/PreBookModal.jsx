// RBR/frontend/src/components/PreBookModal.jsx
import React, { useState } from "react";
import { useStore } from "../Store";
import Login from "./Login";

const DEFAULT_MRP = 2999;
const PREBOOK_PRICE = 499;

const PreBookModal = ({
  isOpen,
  onClose,
  searchQuery,
  suggestedTitle,
  onSuccess,
  apiBase,
}) => {
  const { state } = useStore();
  const user = state?.user || state?.userProfile || {};
  const isLoggedIn = !!state?.authToken || !!state?.isLoggedIn;

  const [showLogin, setShowLogin] = useState(false);
  const [title, setTitle] = useState(suggestedTitle || searchQuery || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const userPhone = user?.phone || user?.mobile || user?.phoneNumber;
  const userName = user?.name || user?.fullName || user?.firstName;

  const handleClose = () => {
    setError("");
    setLoading(false);
    onClose && onClose();
  };

  const ensureLoggedIn = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return false;
    }
    if (!userPhone) {
      setError(
        "We could not detect your phone number. Please re-login and try again."
      );
      return false;
    }
    return true;
  };

  const handlePreBook = async () => {
    setError("");
    if (!ensureLoggedIn()) return;
    if (!title.trim()) {
      setError("Please confirm the report title.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create order via backend
      const res = await fetch(`${apiBase}/prebook/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: state?.authToken ? `Bearer ${state.authToken}` : "",
        },
        body: JSON.stringify({
          userPhone,
          userName,
          reportTitle: title.trim(),
          searchQuery: searchQuery || title.trim(),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create pre-booking order");
      }

      const data = await res.json();
      const { prebookId, razorpayOrderId, amount, currency, razorpayKeyId } =
        data;

      // 2) Open Razorpay Checkout
      if (!window.Razorpay) {
        throw new Error("Razorpay JS not loaded");
      }

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Pre-book: ${title.trim()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: userName || "",
          contact: userPhone || "",
        },
        notes: {
          prebookId,
          reportTitle: title.trim(),
          type: "prebook",
        },
        handler: async function (response) {
          // Called on payment success
          try {
            const confirmRes = await fetch(
              `${apiBase}/prebook/confirm`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: state?.authToken
                    ? `Bearer ${state.authToken}`
                    : "",
                },
                body: JSON.stringify({
                  userPhone,
                  prebookId,
                  razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              }
            );

            if (!confirmRes.ok) {
              throw new Error("Failed to confirm pre-booking");
            }

            onSuccess &&
              onSuccess({
                prebookId,
                reportTitle: title.trim(),
              });
            handleClose();
          } catch (err) {
            console.error(err);
            setError(
              "Payment succeeded but confirmation failed. Please contact support with your payment ID."
            );
          }
        },
        theme: {
          color: "#1c4c82",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Login modal (if user not logged in) */}
      {showLogin && (
        <Login
          isOpen={showLogin}
          toggle={() => setShowLogin(false)}
          // If your Login component has any callback on success,
          // you can hook it to re-trigger ensureLoggedIn.
        />
      )}

      {/* Backdrop */}
      <div
        className="rbr-prebook-backdrop"
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        className="rbr-prebook-modal"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          maxWidth: "480px",
          width: "90%",
          zIndex: 1001,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "8px", fontWeight: 600 }}>
          We’re preparing this report for you
        </h3>
        <p style={{ fontSize: "14px", marginBottom: "8px", color: "#444" }}>
          Our analysts will build this report and deliver it to your profile
          within <b>24 hours.</b>
        </p>

        <div
          style={{
            background: "#f3f9ff",
            borderRadius: "8px",
            padding: "10px 12px",
            margin: "10px 0",
            fontSize: "13px",
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            <b>Special pre-booking price</b>
          </div>
          <div>
            <span
              style={{
                textDecoration: "line-through",
                color: "#888",
                marginRight: "6px",
              }}
            >
              ₹{DEFAULT_MRP.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "18px", fontWeight: 700 }}>
              ₹{PREBOOK_PRICE.toLocaleString("en-IN")}
            </span>{" "}
            <span style={{ color: "#0c7a0c", fontWeight: 500 }}>
              (save ₹
              {(DEFAULT_MRP - PREBOOK_PRICE).toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        <label style={{ fontSize: "13px", fontWeight: 500 }}>
          Report title we will prepare
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            marginTop: "4px",
            marginBottom: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />

        <label style={{ fontSize: "13px", fontWeight: 500 }}>
          Any specific focus / notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Eg: Focus on Tier-2 cities, initial investment under ₹25 lakhs…"
          style={{
            width: "100%",
            padding: "8px 10px",
            marginTop: "4px",
            marginBottom: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "13px",
            resize: "vertical",
          }}
        />

        {error && (
          <div
            style={{
              background: "#ffe8e8",
              color: "#b80000",
              padding: "6px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              marginBottom: "8px",
            }}
          >
            {error}
          </div>
        )}

        <p
          style={{
            fontSize: "12px",
            color: "#777",
            marginBottom: "12px",
          }}
        >
          After payment, you will get a confirmation on WhatsApp, and the report
          will appear under <b>“Pre-booked Reports”</b> in your profile.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff",
              fontSize: "13px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePreBook}
            disabled={loading}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: loading ? "#7aa2d7" : "#1c4c82",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Processing..." : `Pre-book for ₹${PREBOOK_PRICE}`}
          </button>
        </div>
      </div>
    </>
  );
};

PreBookModal.defaultProps = {
  apiBase:
    process.env.REACT_APP_PREBOOK_API_BASE ||
    "https://api.rajanbusinessreports.in",
};

export default PreBookModal;

// RBR/frontend/src/components/ReportsDisplay.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import "./ReportsDisplay.css";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Login from "./Login";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";

// ====== Pricing ======
const MRP = 2999;
const PROMO_PCT = 25;
const FINAL = Math.round(MRP * (1 - PROMO_PCT / 100));

// ====== Lead API ======
const LEAD_API_URL =
  "https://k00o7isai2.execute-api.ap-south-1.amazonaws.com/wa-webhook";

const ReportsDisplay = () => {
  const location = useLocation();
  const fileKeyFromState = location.state?.fileKey || "";
  const reportId = location.state?.reportId || "";
  const reportSlugFromState = location.state?.reportSlug || "";

  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const { state, dispatch: cxtDispatch } = useStore();
  const {
    status = false,
    email = "",
    userInfo = {},
    isLogin: storeIsLogin = false,
  } = state || {};
  const isLoggedIn = !!(userInfo?.isLogin || storeIsLogin);

  const purchases = userInfo?.purchases || [];

  // Derive slug from fileKey if needed (e.g. paper_industry_preview.pdf)
  const derivedSlugFromFileKey = useMemo(() => {
    if (!fileKeyFromState) return "";
    const m = fileKeyFromState.match(/([a-z0-9_]+)(?:_preview)?\.pdf$/i);
    return m ? m[1] : "";
  }, [fileKeyFromState]);

  const reportSlug =
    reportSlugFromState || derivedSlugFromFileKey || "paper_industry";

  const isPurchased = purchases.includes(reportSlug);

  // For viewing: preview if not purchased, full if purchased
  const desiredKey = `${reportSlug}${isPurchased ? "" : "_preview"}.pdf`;

  // UI state
  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  // Lead capture state
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");
  const [leadStep, setLeadStep] = useState("form"); // "form" | "otp" | "wa_wait"
  const [leadToken, setLeadToken] = useState("");
  const [leadChannel, setLeadChannel] = useState(""); // "email" | "whatsapp"
  const [leadOtp, setLeadOtp] = useState("");

  // ====== Fetch presigned URL ======
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!desiredKey) {
        console.error("No desiredKey found. Skipping API request.");
        setIsLoading(false);
        setError("No report key determined. Please try again.");
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_key: desiredKey }),
          }
        );
        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`HTTP error! status: ${response.status} body: ${txt}`);
        }
        const data = await response.json();
        if (data.presigned_url) setPdfUrl(data.presigned_url);
        else throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
      } catch (err) {
        console.error("Error fetching presigned URL:", err);
        setPdfUrl("");
        setError("Failed to load report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [desiredKey]);

  // GA: report preview view
  useEffect(() => {
    if (pdfUrl) {
      window.gtag?.("event", "report_preview_view_desktop", {
        event_category: "engagement",
        report_slug: reportSlug,
        is_purchased: isPurchased ? "yes" : "no",
      });
    }
  }, [pdfUrl, reportSlug, isPurchased]);

  // ====== Payment flow ======
  const handlePayment = () => {
    window.gtag?.("event", "buy_now_click_desktop", {
      event_category: "engagement",
      event_label: "desktop_reports_display",
      value: FINAL,
      report_id: reportId,
      report_slug: reportSlug,
      price_mrp: MRP,
      price_final: FINAL,
      promo: "RBideas25",
    });

    // Use full report key for delivery post-purchase
    cxtDispatch({
      type: "SET_FILE_REPORT",
      payload: { fileKey: `${reportSlug}.pdf`, reportId, reportSlug },
    });

    if (isLoggedIn) {
      navigate("/payment", { state: { fromReport: true } });
    } else {
      setOpenModel(true);
    }
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: "SET_REPORT_STATUS" });
  };

  const title = `${reportSlug.replace(/_/g, " ")} in India`;
  const subtitle = isPurchased
    ? "You’ve unlocked this report from Rajan Business Reports."
    : "Preview of this Rajan Business Reports industry study. Unlock the full report for complete data & forecasts.";

  // ====== Lead capture ======
  const openLead = () => {
    setLeadMsg("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadOtp("");
    setLeadToken("");
    setLeadChannel("");
    setLeadStep("form");
    setLeadOpen(true);
    window.gtag?.("event", "lead_capture_open_desktop", {
      event_category: "engagement",
      report_slug: reportSlug,
    });
  };

  // Step 1: request OTP / WA consent
  const submitLead = async () => {
    if (!leadEmail && !leadPhone) {
      setLeadMsg("Please enter your email or WhatsApp number.");
      return;
    }

    setLeadBusy(true);
    setLeadMsg("");
    try {
      const resp = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RBR-Action": "request",
        },
        body: JSON.stringify({
          email: leadEmail || undefined,
          phone: leadPhone || undefined,
          report_slug: reportSlug,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Request failed (${resp.status})`);
      }

      const channel = data.channel || (leadPhone ? "whatsapp" : "email");
      setLeadToken(data.token || "");
      setLeadChannel(channel);

      if (channel === "email") {
        setLeadStep("otp");
        setLeadMsg(
          "We’ve sent a 6-digit code to your email. Enter it below to receive your 2-page preview."
        );
      } else {
        setLeadStep("wa_wait");
        setLeadMsg(
          "We’ve sent you a WhatsApp message. Tap “Yes, I requested” in WhatsApp to receive your 2-page preview there."
        );
      }

      window.gtag?.("event", "lead_capture_submit_desktop", {
        event_category: "engagement",
        report_slug: reportSlug,
        channel,
        phase: channel === "email" ? "otp_sent" : "consent_sent",
      });
    } catch (e) {
      console.error(e);
      setLeadMsg("Something went wrong. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  };

  // Step 2: verify OTP (EMAIL ONLY)
  const submitOtp = async () => {
    if (leadChannel === "whatsapp") {
      setLeadMsg(
        'For WhatsApp, no code is needed. Just tap “Yes, I requested” in WhatsApp.'
      );
      return;
    }

    if (!leadOtp.trim()) {
      setLeadMsg("Please enter the 6-digit code.");
      return;
    }
    if (!leadToken) {
      setLeadMsg("Session expired. Please start again.");
      setLeadStep("form");
      return;
    }

    setLeadBusy(true);
    setLeadMsg("");
    try {
      const resp = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RBR-Action": "verify-send",
        },
        body: JSON.stringify({
          token: leadToken,
          otp: leadOtp.trim(),
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Verification failed (${resp.status})`);
      }

      window.gtag?.("event", "lead_capture_submit_desktop", {
        event_category: "engagement",
        report_slug: reportSlug,
        channel: leadChannel || (leadPhone ? "whatsapp" : "email"),
        phase: "verified_and_sent",
      });

      setLeadMsg("✅ Verified! We’ve sent your 2-page preview.");
      setTimeout(() => setLeadOpen(false), 1500);
    } catch (e) {
      console.error(e);
      setLeadMsg("Incorrect or expired code. Please check and try again.");
    } finally {
      setLeadBusy(false);
    }
  };

  return (
    <>
      <div className="report-display">
        {/* Top nav – lightly themed but aligned with mobile */}
        <nav
          className="navbar navbar-expand-lg"
          style={{
            background:
              "linear-gradient(90deg, #1d4ed8 0%, #2563eb 40%, #4f46e5 100%)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(15,23,42,0.55)",
          }}
        >
          <div className="container-fluid">
            <div className="nav-left" style={{ alignItems: "center" }}>
              <div className="logo">
                <Link to="/" className="navbar-brand">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={logo}
                      alt="RBR"
                      style={{ width: 42, height: 42, objectFit: "contain" }}
                    />
                  </div>
                </Link>
              </div>
              <div className="text" style={{ marginLeft: 16 }}>
                <p
                  className="report-display-title"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: "white",
                  }}
                >
                  {title}
                </p>
                <p
                  className="report-display-desc"
                  style={{
                    marginTop: 0,
                    maxWidth: 520,
                    fontSize: 13,
                    color: "rgba(219,234,254,1)",
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {!isPurchased && (
                <span
                  style={{
                    background: "rgba(254, 243, 199, 0.9)",
                    color: "#92400e",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {PROMO_PCT}% off launch price
                </span>
              )}
              {isPurchased ? (
                <span
                  style={{
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "rgba(167, 243, 208, 0.9)",
                    color: "#064e3b",
                  }}
                >
                  ✅ Purchased
                </span>
              ) : (
                <button
                  className="buy-btn"
                  onClick={handlePayment}
                  style={{
                    color: "#111827",
                    background:
                      "linear-gradient(90deg,#facc15,#fbbf24,#fde047)",
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "8px 18px",
                    border: "none",
                    boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
                  }}
                >
                  Pay & unlock now
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* PDF viewer */}
        <div
          className="viewer col-md-11 col-sm-11 col-11"
          style={{
            position: "relative",
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center text-muted">
                  <div className="spinner-border" role="status" />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    Preparing your preview…
                  </div>
                </div>
              </div>
            ) : pdfUrl ? (
              <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
            ) : (
              <div className="error-message text-danger text-center">
                {error || "Failed to load report. No fileKey or API issue."}
              </div>
            )}
          </Worker>

          {/* Locked preview overlay */}
          {!isPurchased && pdfUrl && !isLoading && (
            <>
              {/* Block interaction with PDF */}
              <div
                className="position-absolute"
                style={{
                  inset: 0,
                  zIndex: 10,
                  background: "transparent",
                }}
              />

              {/* Blur / darken */}
              <div
                className="position-absolute"
                style={{
                  inset: 0,
                  zIndex: 11,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.4) 40%, rgba(15,23,42,0.9) 100%)",
                  backdropFilter: "blur(2px)",
                }}
              />

              {/* Callout card */}
              <div
                className="position-absolute d-flex justify-content-center"
                style={{ insetInline: 0, bottom: 24, zIndex: 20, pointerEvents: "none" }}
              >
                <div
                  style={{
                    pointerEvents: "auto",
                    maxWidth: 520,
                    width: "90%",
                    borderRadius: 18,
                    padding: "16px 18px 14px",
                    background:
                      "radial-gradient(circle at top left,#1f2937,#020617)",
                    border: "1px solid rgba(59,130,246,0.6)",
                    boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
                    color: "white",
                    fontSize: 13,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.09em",
                          background: "rgba(59,130,246,0.2)",
                          border: "1px solid rgba(96,165,250,0.7)",
                          color: "#bfdbfe",
                          marginBottom: 4,
                        }}
                      >
                        Locked preview
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        Get the full industry report + 2-page preview PDF
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11 }}>
                      <div
                        style={{
                          textDecoration: "line-through",
                          color: "#9ca3af",
                        }}
                      >
                        ₹{MRP.toLocaleString("en-IN")}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#facc15",
                          lineHeight: 1.2,
                        }}
                      >
                        ₹{FINAL.toLocaleString("en-IN")}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6ee7b7",
                        }}
                      >
                        {PROMO_PCT}% launch discount
                      </div>
                    </div>
                  </div>

                  <ul
                    style={{
                      marginTop: 8,
                      paddingLeft: 18,
                      fontSize: 11,
                      color: "#e5e7eb",
                    }}
                  >
                    <li>Exact market size & 5-year forecast</li>
                    <li>Competitor list, pricing bands & margins</li>
                    <li>Risks, regulations & “go / no-go” checklist</li>
                  </ul>

                  {/* CTA block – Pay OR Preview */}
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={handlePayment}
                      className="w-100"
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "none",
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        background:
                          "linear-gradient(90deg,#facc15,#fbbf24,#fde047)",
                        color: "#111827",
                        boxShadow: "0 14px 30px rgba(15,23,42,0.85)",
                      }}
                    >
                      Pay & unlock full report — ₹
                      {FINAL.toLocaleString("en-IN")}
                    </button>

                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 10,
                        color: "#d1d5db",
                        marginTop: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                      }}
                    >
                      or
                    </div>

                    <button
                      onClick={openLead}
                      style={{
                        width: "100%",
                        marginTop: 4,
                        borderRadius: 12,
                        padding: "9px 12px",
                        fontSize: 13,
                        fontWeight: 500,
                        background: "rgba(15,23,42,0.9)",
                        color: "#f9fafb",
                        border: "1px solid rgba(148,163,184,0.9)",
                      }}
                    >
                      Get a <strong>free 2-page preview</strong> first
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 10,
                      textAlign: "center",
                      color: "#d1d5db",
                    }}
                  >
                    Free preview helps you evaluate the report before you decide
                    to buy.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Login / Payment Modal */}
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(false)}
        style={{ maxWidth: "650px", width: "100%", marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          <Login onClose={() => setOpenModel(false)} returnTo="/payment" />
          {status && (
            <div style={{ textAlign: "center" }}>
              <p className="success-head">
                The report has been successfully sent to
              </p>
              <p className="success-email">{email}</p>
              <button className="btn btn-primary" onClick={changeStatus}>
                Ok
              </button>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Lead Capture Modal (email OTP + WhatsApp consent) */}
      {leadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 d-flex align-items-center justify-content-center"
          onClick={() => setLeadOpen(false)}
        >
          <div className="position-absolute w-100 h-100" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
          <div
            className="position-relative"
            style={{
              zIndex: 10,
              width: "92%",
              maxWidth: 420,
              borderRadius: 18,
              boxShadow: "0 22px 55px rgba(15,23,42,0.9)",
              border: "1px solid rgba(75,85,99,0.8)",
              background: "#020617",
              color: "white",
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                Get a 2-page preview PDF
              </h3>
              <button
                onClick={() => setLeadOpen(false)}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  border: "none",
                  background: "#111827",
                  color: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <p
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              We’ll send a concise 2-page preview of this report to your email
              or WhatsApp after a quick verification.
            </p>

            {/* Step 1: capture contact */}
            {leadStep === "form" && (
              <>
                <div style={{ marginTop: 12 }}>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      background: "#020617",
                      padding: "8px 10px",
                      fontSize: 13,
                      color: "white",
                      marginBottom: 8,
                    }}
                  />
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="WhatsApp number (optional, with country code)"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      background: "#020617",
                      padding: "8px 10px",
                      fontSize: 13,
                      color: "white",
                    }}
                  />
                </div>
                {leadMsg && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#facc15",
                    }}
                  >
                    {leadMsg}
                  </div>
                )}
                <div className="d-flex gap-2" style={{ marginTop: 14 }}>
                  <button
                    onClick={submitLead}
                    disabled={leadBusy}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      border: "none",
                      padding: "9px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      background:
                        "linear-gradient(90deg,#facc15,#fbbf24,#fde047)",
                      color: "#111827",
                      opacity: leadBusy ? 0.7 : 1,
                    }}
                  >
                    {leadBusy ? "Sending…" : "Send preview"}
                  </button>
                  <button
                    onClick={handlePayment}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      padding: "9px 12px",
                      fontSize: 13,
                      background: "#020617",
                      color: "#e5e7eb",
                    }}
                  >
                    Unlock full report
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (email): OTP UI */}
            {leadStep === "otp" && leadChannel === "email" && (
              <>
                <div style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    value={leadOtp}
                    onChange={(e) => setLeadOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      background: "#020617",
                      padding: "8px 10px",
                      fontSize: 16,
                      letterSpacing: "0.3em",
                      textAlign: "center",
                      color: "white",
                    }}
                  />
                </div>
                {leadMsg && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#facc15",
                    }}
                  >
                    {leadMsg}
                  </div>
                )}
                <div className="d-flex gap-2" style={{ marginTop: 14 }}>
                  <button
                    onClick={submitOtp}
                    disabled={leadBusy}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      border: "none",
                      padding: "9px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      background:
                        "linear-gradient(90deg,#facc15,#fbbf24,#fde047)",
                      color: "#111827",
                      opacity: leadBusy ? 0.7 : 1,
                    }}
                  >
                    {leadBusy ? "Verifying…" : "Verify & send preview"}
                  </button>
                  <button
                    onClick={() => {
                      setLeadStep("form");
                      setLeadOtp("");
                      setLeadMsg("");
                      setLeadChannel("");
                      setLeadToken("");
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      padding: "9px 12px",
                      fontSize: 13,
                      background: "#020617",
                      color: "#e5e7eb",
                    }}
                  >
                    Start again
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (WhatsApp): Check WhatsApp screen */}
            {leadStep === "wa_wait" && leadChannel === "whatsapp" && (
              <>
                <div style={{ marginTop: 14, fontSize: 13, color: "#e5e7eb" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    📲 Check WhatsApp to confirm
                  </div>
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    We’ve sent you a message on WhatsApp from{" "}
                    <strong>Rajan Business Ideas – Prod</strong>.
                  </p>
                  <ul
                    style={{
                      marginTop: 6,
                      paddingLeft: 18,
                      fontSize: 11,
                      color: "#e5e7eb",
                    }}
                  >
                    <li>Open WhatsApp on your phone.</li>
                    <li>
                      Find the message about “
                      {reportSlug.replace(/_/g, " ")} in India”.
                    </li>
                    <li>
                      Tap <strong>“Yes, I requested”</strong>.
                    </li>
                    <li>You’ll immediately receive the 2-page preview.</li>
                  </ul>
                </div>
                {leadMsg && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#facc15",
                    }}
                  >
                    {leadMsg}
                  </div>
                )}
                <div className="d-flex gap-2" style={{ marginTop: 14 }}>
                  <button
                    onClick={() => setLeadOpen(false)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      border: "none",
                      padding: "9px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      background:
                        "linear-gradient(90deg,#facc15,#fbbf24,#fde047)",
                      color: "#111827",
                    }}
                  >
                    Okay, I’ll check WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setLeadStep("form");
                      setLeadChannel("");
                      setLeadToken("");
                      setLeadMsg("");
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #4b5563",
                      padding: "9px 12px",
                      fontSize: 13,
                      background: "#020617",
                      color: "#e5e7eb",
                    }}
                  >
                    Use email instead
                  </button>
                </div>
              </>
            )}

            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: "#9ca3af",
              }}
            >
              🔒 We only use your contact to send the 2-page preview. No spam,
              no sharing with third parties.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsDisplay;

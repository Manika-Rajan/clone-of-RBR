// RBR/frontend/src/components/ReportsDisplayMobile.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";
import Login from "./Login";

// ====== Pricing ======
const MRP = 2999;
const PROMO_PCT = 25;
const FINAL = Math.round(MRP * (1 - PROMO_PCT / 100));

// ====== Lead API ======
const LEAD_API_URL =
  "https://k00o7isai2.execute-api.ap-south-1.amazonaws.com/wa-webhook";

const ReportsDisplayMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // From router state
  const reportSlugFromState = location.state?.reportSlug || "";
  const fileKeyLegacy = location.state?.fileKey || ""; // legacy fallback
  const reportId = location.state?.reportId || "";

  const { state, dispatch: cxtDispatch } = useStore();
  const { status = false, email = "", userInfo = {} } = state || {};
  const isLoggedIn = !!userInfo?.isLogin;

  // Purchases list: array of slugs, e.g., ["paper_industry", "fmcg"]
  const purchases = userInfo?.purchases || [];

  // Derive slug from legacy fileKey if needed
  const derivedSlugFromFileKey = useMemo(() => {
    if (!fileKeyLegacy) return "";
    const m = fileKeyLegacy.match(/([a-z0-9_]+)(?:_preview)?\.pdf$/i);
    return m ? m[1] : "";
  }, [fileKeyLegacy]);

  const reportSlug =
    reportSlugFromState || derivedSlugFromFileKey || "paper_industry";

  // Purchased?
  const isPurchased = purchases.includes(reportSlug);

  // Key to pre-sign
  const desiredKey = `${reportSlug}${isPurchased ? "" : "_preview"}.pdf`;

  // UI state
  const [openModel, setOpenModel] = useState(false); // login/payment modal
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  // Lead capture modal
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");

  // OTP / consent flow
  const [leadStep, setLeadStep] = useState("form"); // "form" | "otp" | "wa_wait"
  const [leadToken, setLeadToken] = useState("");
  const [leadChannel, setLeadChannel] = useState(""); // "email" or "whatsapp"
  const [leadOtp, setLeadOtp] = useState("");

  // ====== Fetch presigned URL ======
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!desiredKey) {
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
          throw new Error(`HTTP ${response.status}: ${txt}`);
        }
        const data = await response.json();
        if (!data.presigned_url) {
          throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
        }
        setPdfUrl(data.presigned_url);
      } catch (err) {
        console.error("Error fetching presigned URL:", err);
        setError("Failed to load report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresignedUrl();
  }, [desiredKey]);

  // ====== GA: report preview view ======
  useEffect(() => {
    if (pdfUrl) {
      window.gtag?.("event", "report_preview_view", {
        event_category: "engagement",
        report_slug: reportSlug,
        is_purchased: isPurchased ? "yes" : "no",
      });
    }
  }, [pdfUrl, reportSlug, isPurchased]);

  // ====== PAYMENT FLOW ======
  const goToPayment = () => {
    window.gtag?.("event", "buy_now_click", {
      event_category: "engagement",
      event_label: "mobile_reports_display",
      value: FINAL,
      report_id: reportId,
      report_slug: reportSlug,
      price_mrp: MRP,
      price_final: FINAL,
      promo: "RBideas25",
    });

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
    ? "You’ve unlocked the full report. Access the complete analysis below."
    : "Preview of this RBR industry report. Unlock the full version for detailed data & forecasts.";

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
    window.gtag?.("event", "lead_capture_open", {
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

      window.gtag?.("event", "lead_capture_submit", {
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

      window.gtag?.("event", "lead_capture_submit", {
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
      <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#f5f5f7]/95 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="shrink-0">
              <img
                src={logo}
                alt="RBR"
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white p-1"
              />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-slate-900 truncate">
                {title}
              </h1>
              <p className="text-[12px] text-slate-600 leading-snug line-clamp-2">
                {subtitle}
              </p>
            </div>
            <span className="ml-auto rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              Preview
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="relative flex-1 overflow-auto">
          {/* Loader */}
          {isLoading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <svg
                  className="mx-auto animate-spin"
                  viewBox="0 0 100 100"
                  width="48"
                  height="48"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset="70"
                  />
                </svg>
                <p className="mt-3 text-sm text-slate-900 font-medium">
                  Fetching your report…
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This usually takes just a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-red-600 mb-3 font-medium">{error}</p>
              <p className="text-xs text-slate-500 mb-5">
                You can go back and re-open the report, or try reloading this
                page.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm bg-white active:scale-[0.98]"
                >
                  Go back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm active:scale-[0.98]"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !error && pdfUrl && (
            <div className="relative h-[calc(100vh-150px)] sm:h-[calc(100vh-140px)] bg-slate-100">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer fileUrl={pdfUrl} />
              </Worker>

              {/* PREVIEW LOCK OVERLAY (blocks interaction when not purchased) */}
              {!isPurchased && (
                <>
                  {/* Interaction blocker */}
                  <div className="absolute inset-0 z-10 bg-transparent" />

                  {/* Blur / gradient */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/95 backdrop-blur-[3px]" />
                  </div>

                  {/* Callout card */}
                  <div className="absolute inset-x-0 bottom-4 z-30 px-4">
                    <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white shadow-lg px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">
                          You’re viewing a locked preview
                        </div>
                        <div className="text-xs text-slate-600">
                          Unlock the complete report with market size, 5-year
                          forecast, competitor list, pricing trends & risks.
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button
                          onClick={goToPayment}
                          className="w-full rounded-xl bg-slate-900 text-white text-sm py-2.5 font-medium active:scale-[0.98]"
                        >
                          Unlock full report — ₹
                          {FINAL.toLocaleString("en-IN")}
                        </button>
                        <button
                          onClick={openLead}
                          className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 text-slate-800 active:scale-[0.98]"
                        >
                          Get 2-page preview
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>🔒 Secure UPI/Cards</span>
                        <span>•</span>
                        <span>✅ 7-day money-back</span>
                        <span>•</span>
                        <span>⏱️ Instant access</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 leading-none">
                Report ID
              </p>
              <p className="text-sm font-medium text-slate-900 truncate">
                {reportId || "—"}
              </p>
            </div>

            {isPurchased ? (
              <div className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                ✅ Already purchased
              </div>
            ) : (
              <>
                <div className="ml-2 text-right">
                  <div className="text-[11px] text-slate-400 line-through">
                    ₹{MRP.toLocaleString("en-IN")}
                  </div>
                  <div className="text-base font-semibold text-slate-900 leading-tight">
                    ₹{FINAL.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-emerald-600">
                    RBideas25 applied
                  </div>
                </div>
                <button
                  onClick={goToPayment}
                  className="ml-auto rounded-xl bg-slate-900 text-white text-sm px-4 py-2.5 font-medium active:scale-[0.98]"
                >
                  Unlock full report
                </button>
              </>
            )}
          </div>
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
                The Report has been successfully sent to
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setLeadOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-slate-200 bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Get a 2-page preview
              </h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              We’ll send a 2-page preview PDF to your email or WhatsApp after a
              quick verification.
            </p>

            {/* Step 1: capture contact */}
            {leadStep === "form" && (
              <>
                <div className="mt-3 space-y-2">
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/70"
                  />
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="WhatsApp number (optional, with country code)"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/70"
                  />
                </div>
                {leadMsg && (
                  <div className="mt-2 text-xs text-slate-700">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitLead}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-slate-900 text-white text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-medium"
                  >
                    {leadBusy ? "Sending…" : "Send preview"}
                  </button>
                  <button
                    onClick={goToPayment}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-800 bg-white active:scale-[0.98]"
                  >
                    Unlock full report
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (email): OTP UI */}
            {leadStep === "otp" && leadChannel === "email" && (
              <>
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={leadOtp}
                    onChange={(e) => setLeadOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/70 tracking-[0.3em] text-center"
                  />
                </div>
                {leadMsg && (
                  <div className="mt-2 text-xs text-slate-700">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitOtp}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-slate-900 text-white text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-medium"
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
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-800 bg-white active:scale-[0.98]"
                  >
                    Start again
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (WhatsApp): Check WhatsApp screen */}
            {leadStep === "wa_wait" && leadChannel === "whatsapp" && (
              <>
                <div className="mt-4 space-y-2 text-sm text-slate-800">
                  <div className="text-lg font-semibold">
                    📲 Check WhatsApp to confirm
                  </div>
                  <p className="text-xs text-slate-600">
                    We’ve sent you a message on WhatsApp from{" "}
                    <strong>Rajan Business Ideas – Prod</strong>.
                  </p>
                  <ul className="mt-2 list-disc list-inside text-xs text-slate-700 space-y-1">
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
                  <div className="mt-3 text-xs text-slate-700">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setLeadOpen(false)}
                    className="flex-1 rounded-xl bg-slate-900 text-white text-sm py-2.5 active:scale-[0.98] font-medium"
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
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-800 bg-white active:scale-[0.98]"
                  >
                    Use email instead
                  </button>
                </div>
              </>
            )}

            <div className="mt-2 text-[11px] text-slate-500">
              🔒 We only use your contact to send the 2-page preview. No spam.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsDisplayMobile;

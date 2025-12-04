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

  // 🔹 Option C: 2-page sample PDF (stored in public/samples)
  // e.g. clone-of-RBR/frontend/public/samples/paper_industry_sample_2pages.pdf
  const samplePdfUrl =
    reportSlug === "paper_industry"
      ? `/samples/${reportSlug}_sample_2pages.pdf`
      : null;

  // UI state
  const [openModel, setOpenModel] = useState(false); // login/payment modal
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  // 🔹 NEW: Sample PDF modal state
  const [sampleOpen, setSampleOpen] = useState(false);

  // Lead capture modal
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");

  // NEW: country code for WhatsApp
  const [leadCountryCode, setLeadCountryCode] = useState("+91");

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

    // Normalise phone into +E.164 if provided
    let normalizedPhone = undefined;
    if (leadPhone) {
      const digitsOnly = leadPhone.replace(/\D/g, ""); // strip spaces, dashes, etc.
      if (!digitsOnly) {
        setLeadMsg("Please enter a valid WhatsApp number.");
        return;
      }
      normalizedPhone = `${leadCountryCode}${digitsOnly}`;
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
          phone: normalizedPhone,
          report_slug: reportSlug,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Request failed (${resp.status})`);
      }

      const channel = data.channel || (normalizedPhone ? "whatsapp" : "email");
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-slate-950 to-slate-900">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md">
          <div className="px-4 pt-3 pb-4 flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <img src={logo} alt="RBR" className="h-7 w-7" />
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-semibold truncate">
                  {title}
                </h1>
                {!isPurchased && (
                  <span className="inline-flex items-center rounded-full bg-amber-400/90 text-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {PROMO_PCT}% off
                  </span>
                )}
              </div>
              <p className="mt-[2px] text-[11px] text-blue-100 leading-snug line-clamp-2">
                {subtitle}
              </p>
            </div>
            {isPurchased ? (
              <span className="ml-auto inline-flex items-center rounded-full bg-emerald-300/90 text-emerald-900 px-2.5 py-1 text-[11px] font-semibold">
                ✅ Purchased
              </span>
            ) : (
              <button
                onClick={goToPayment}
                className="ml-auto rounded-full bg-white text-[11px] font-semibold text-blue-700 px-3 py-1.5 active:scale-[0.96] shadow-sm"
              >
                Unlock now
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="relative flex-1 overflow-auto">
          {/* Loader */}
          {isLoading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center text-white/90">
                <svg
                  className="mx-auto animate-spin"
                  viewBox="0 0 100 100"
                  width="50"
                  height="50"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset="70"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium">
                  Preparing your preview…
                </p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Loading the latest version of this report.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-5 py-10 text-center text-white">
              <p className="text-sm text-amber-300 mb-3 font-semibold">
                {error}
              </p>
              <p className="text-xs text-slate-300 mb-5">
                You can go back and re-open the report, or try reloading this
                page.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-slate-500 text-slate-100 text-sm bg-transparent active:scale-[0.98]"
                >
                  Go back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold active:scale-[0.98]"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !error && pdfUrl && (
            <div className="relative h-[calc(100vh-150px)] sm:h-[calc(100vh-140px)] bg-slate-900">
              <div className="h-full bg-white">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer fileUrl={pdfUrl} />
                </Worker>
              </div>

              {/* PREVIEW LOCK OVERLAY (blocks interaction when not purchased) */}
              {!isPurchased && (
                <>
                  {/* Interaction blocker */}
                  <div className="absolute inset-0 z-10 bg-transparent" />

                  {/* Blur / gradient */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-950/95 backdrop-blur-[3px]" />
                  </div>

                  {/* Callout card with CTAs + Option C sample button */}
                  <div className="absolute inset-x-0 bottom-4 z-30 px-4">
                    <div className="mx-auto max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-blue-500/40 shadow-[0_20px_45px_rgba(15,23,42,0.75)] px-4 py-4 text-white">
                      {/* Header + short pitch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200 border border-blue-400/50">
                            Locked preview
                          </div>
                          <div className="text-sm font-semibold">
                            Get the full industry report + 2-page preview PDF
                          </div>
                        </div>
                        <div className="text-right text-[11px]">
                          <div className="line-through text-slate-400">
                            ₹{MRP.toLocaleString("en-IN")}
                          </div>
                          <div className="text-base font-semibold text-amber-300 leading-tight">
                            ₹{FINAL.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            {PROMO_PCT}% launch discount
                          </div>
                        </div>
                      </div>

                      {/* Bullets */}
                      <ul className="mt-2 space-y-1.5 text-[11px] text-slate-200 list-disc list-inside">
                        <li>Exact market size &amp; 5-year forecast</li>
                        <li>Competitor list, pricing bands &amp; margins</li>
                        <li>Risks, regulations &amp; “go / no-go” checklist</li>
                      </ul>

                      {/* CTA block – with Option C sample button */}
                      <div className="mt-3 space-y-2">
                        <button
                          onClick={goToPayment}
                          className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 font-semibold active:scale-[0.98]"
                        >
                          Pay &amp; unlock full report — ₹
                          {FINAL.toLocaleString("en-IN")}
                        </button>

                        <div className="text-center text-[10px] text-slate-300 uppercase tracking-[0.18em]">
                          or
                        </div>

                        <button
                          onClick={openLead}
                          className="w-full rounded-xl border border-slate-500 bg-slate-900/80 text-[13px] font-medium text-slate-50 py-2.5 active:scale-[0.98]"
                        >
                          Get a{" "}
                          <span className="font-semibold">
                            free 2-page preview
                          </span>{" "}
                          first
                        </button>

                        {/* 🔹 Option C: view 2-page sample PDF button */}
                        {samplePdfUrl && (
                          <button
                            type="button"
                            onClick={() => setSampleOpen(true)}
                            className="w-full rounded-xl border border-dashed border-slate-600 bg-slate-950/70 text-[11px] text-slate-200 py-2 active:scale-[0.98]"
                          >
                            📄 View 2-page sample from this report
                          </button>
                        )}
                      </div>

                      {/* Trust note */}
                      <div className="mt-2 text-[10px] text-slate-300 text-center">
                        Free preview + sample pages help you evaluate the report
                        before you decide to buy.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3 text-white">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 leading-none">
                Report ID
              </p>
              <p className="text-sm font-medium truncate">
                {reportId || "—"}
              </p>
            </div>

            {isPurchased ? (
              <div className="ml-auto inline-flex items-center rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/60">
                ✅ Already purchased
              </div>
            ) : (
              <>
                <div className="ml-2 text-right">
                  <div className="text-[11px] text-slate-500 line-through">
                    ₹{MRP.toLocaleString("en-IN")}
                  </div>
                  <div className="text-base font-semibold text-amber-300 leading-tight">
                    ₹{FINAL.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    RBideas25 applied
                  </div>
                </div>
                <button
                  onClick={goToPayment}
                  className="ml-auto rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm px-4 py-2.5 font-semibold active:scale-[0.97] shadow-[0_10px_25px_rgba(15,23,42,0.8)]"
                >
                  Pay &amp; unlock now
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setLeadOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.85)] border border-slate-700 bg-slate-950 text-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">
                Get a 2-page preview PDF
              </h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">
              We’ll send a concise 2-page preview of this report to your email
              or WhatsApp after a quick verification.
            </p>

            {/* Step 1: capture contact */}
            {leadStep === "form" && (
              <>
                <div className="mt-3 space-y-2">
                  {/* Email input */}
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                  />

                  {/* OR divider */}
                  <div className="flex items-center justify-center my-1">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="mx-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      or
                    </span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* ROW: country code + phone */}
                  <div className="flex w-full gap-2">
                    {/* Country Code Dropdown */}
                    <select
                      value={leadCountryCode}
                      onChange={(e) => setLeadCountryCode(e.target.value)}
                      className="shrink-0 w-[80px] rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="WhatsApp number (optional)"
                      className="flex-1 min-w-0 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                    />
                  </div>

                  {/* Helper text */}
                  <p className="text-[10px] text-slate-400">
                    You can fill either email or WhatsApp number. One is enough
                    to get your preview.
                  </p>
                </div>

                {leadMsg && (
                  <div className="mt-2 text-[11px] text-amber-200">
                    {leadMsg}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitLead}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-semibold"
                  >
                    {leadBusy ? "Sending…" : "Send preview"}
                  </button>
                  <button
                    onClick={goToPayment}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
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
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-center tracking-[0.3em] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                  />
                </div>
                {leadMsg && (
                  <div className="mt-2 text-[11px] text-amber-200">
                    {leadMsg}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitOtp}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-semibold"
                  >
                    {leadBusy ? "Verifying…" : "Verify &amp; send preview"}
                  </button>
                  <button
                    onClick={() => {
                      setLeadStep("form");
                      setLeadOtp("");
                      setLeadMsg("");
                      setLeadChannel("");
                      setLeadToken("");
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
                  >
                    Start again
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (WhatsApp): Check WhatsApp screen */}
            {leadStep === "wa_wait" && leadChannel === "whatsapp" && (
              <>
                <div className="mt-4 space-y-2 text-sm text-slate-100">
                  <div className="text-lg font-semibold">
                    📲 Check WhatsApp to confirm
                  </div>
                  <p className="text-[11px] text-slate-300">
                    We’ve sent you a message on WhatsApp from{" "}
                    <strong>Rajan Business Ideas – Prod</strong>.
                  </p>
                  <ul className="mt-2 list-disc list-inside text-[11px] text-slate-200 space-y-1">
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
                  <div className="mt-3 text-[11px] text-amber-200">
                    {leadMsg}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setLeadOpen(false)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] font-semibold"
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
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
                  >
                    Use email instead
                  </button>
                </div>
              </>
            )}

            <div className="mt-2 text-[10px] text-slate-400">
              🔒 We only use your contact to send the 2-page preview. No spam,
              no sharing with third parties.
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Option C: 2-page sample PDF fullscreen modal */}
      {sampleOpen && samplePdfUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setSampleOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[94%] max-w-md rounded-2xl bg-slate-950 border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                2-page sample from this report
              </h3>
              <button
                onClick={() => setSampleOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-lg leading-none"
                aria-label="Close sample"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">
              Scroll through the first 2 pages to quickly judge the structure,
              charts, and writing style of the report.
            </p>

            <div className="mt-3 max-h-[70vh] rounded-xl overflow-hidden bg-slate-900">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer fileUrl={samplePdfUrl} />
              </Worker>
            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              This is only a short sample. The full report includes all sections
              with complete market size, forecasts, competitors, and risks.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsDisplayMobile;

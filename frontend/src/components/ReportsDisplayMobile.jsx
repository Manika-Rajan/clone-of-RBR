// RBR/frontend/src/components/ReportsDisplayMobile.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";
import Login from "./Login";

// ====== Pricing (keep/change freely) ======
const MRP = 2999;
const PROMO_PCT = 25;
const FINAL = Math.round(MRP * (1 - PROMO_PCT / 100));

// ====== Lead API (TODO: set your endpoint) ======
const LEAD_API_URL = "https://k00o7isai2.execute-api.ap-south-1.amazonaws.com/wa-webhook"; // <-- TODO replace

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

  const reportSlug = reportSlugFromState || derivedSlugFromFileKey || "paper_industry";

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

  // New: OTP flow
  const [leadStep, setLeadStep] = useState("form"); // "form" | "otp"
  const [leadToken, setLeadToken] = useState("");
  const [leadChannel, setLeadChannel] = useState(""); // "email" or "whatsapp"
  const [leadOtp, setLeadOtp] = useState("");

  const headerRef = useRef(null);

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
      payload: { fileKey: `${reportSlug}.pdf`, reportId, reportSlug }, // store the full file key to deliver post-purchase
    });

    if (isLoggedIn) {
      navigate("/payment", { state: { fromReport: true } });
    } else {
      setOpenModel(true);
    }
  };

  // OPTIONAL: Use if you want Razorpay “UPI-first” experience directly here.
  // Call openFastCheckout() instead of goToPayment(), once you wire an orderId backend.
  const openFastCheckout = (orderId) => {
    // TODO: replace with your Razorpay key + orderId
    const options = {
      key: "rzp_live_xxxxxxx", // <-- your key
      amount: FINAL * 100,
      currency: "INR",
      name: "RBR Reports",
      description: `Unlock: ${reportSlug.replace(/_/g, " ")} report`,
      order_id: orderId, // from your server
      prefill: {
        name: userInfo?.name || "",
        email: userInfo?.email || "",
        contact: userInfo?.phone || "",
      },
      notes: { report_slug: reportSlug, report_id: reportId },
      theme: { color: "#0B63C7" },
      config: {
        display: {
          blocks: {
            upi: {
              name: "UPI",
              instruments: [{ method: "upi" }, { method: "upi_intent" }],
            },
          },
          sequence: ["upi", "card", "netbanking", "wallet"],
          preferences: { show_default_blocks: true },
        },
      },
      handler: function (resp) {
        // On success → navigate to thank-you / mark purchase
        // Mark purchase (add slug) in your user store after backend verifies signature
        navigate("/payment-success", {
          state: { reportSlug, reportId, razorpayPaymentId: resp.razorpay_payment_id },
        });
      },
      modal: {
        ondismiss: function () {
          // user closed checkout
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: "SET_REPORT_STATUS" });
  };

  const title = `${reportSlug.replace(/_/g, " ")} in India`;
  const subtitle = isPurchased
    ? "Thanks for your purchase! You can access the full report below."
    : "Preview the report. Buy to unlock the complete version.";

  // ====== Lead capture ======
  const openLead = () => {
    setLeadMsg("");
    setLeadOpen(true);
    window.gtag?.("event", "lead_capture_open", {
      event_category: "engagement",
      report_slug: reportSlug,
    });
  };

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail || undefined,
          phone: leadPhone || undefined,
          report_slug: reportSlug,
          intent: "summary_teaser", // server can send a 2-page teaser
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Lead API failed: ${t}`);
      }
      window.gtag?.("event", "lead_capture_submit", {
        event_category: "engagement",
        report_slug: reportSlug,
        channel: leadPhone ? "whatsapp" : "email",
      });
      setLeadMsg("✅ We’ll send your 2-page summary shortly.");
      setTimeout(() => setLeadOpen(false), 1200);
    } catch (e) {
      console.error(e);
      setLeadMsg("Something went wrong. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Sticky Header */}
        <header
          ref={headerRef}
          className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="shrink-0">
              <img src={logo} alt="RBR" className="h-10 w-10" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-gray-900 truncate">
                {title}
              </h1>
              <p className="text-[12px] text-gray-600 leading-tight line-clamp-2">
                {subtitle}
              </p>
            </div>
            {isPurchased ? (
              <div className="ml-auto text-green-700 text-xs font-semibold">
                ● ALREADY PURCHASED
              </div>
            ) : (
              <button
                onClick={goToPayment}
                className="ml-auto bg-blue-600 text-white text-sm px-3 py-2 rounded-lg active:scale-[0.98]"
              >
                Unlock full report
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="relative flex-1 overflow-auto">
          {/* Loader */}
          {isLoading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <svg className="mx-auto animate-spin" viewBox="0 0 100 100" width="56" height="56">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e6e6e6" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0263c7" strokeWidth="8" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="70" />
                </svg>
                <p className="mt-3 text-sm text-gray-800">Fetching your report…</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm">
                  Go Back
                </button>
                <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !error && pdfUrl && (
            <div className="relative h-[calc(100vh-150px)] sm:h-[calc(100vh-140px)]">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer fileUrl={pdfUrl} />
              </Worker>

              {/* PREVIEW LOCK OVERLAY (blocks interaction when not purchased) */}
              {!isPurchased && (
                <>
                  {/* Interaction blocker */}
                  <div className="absolute inset-0 z-10 bg-transparent" />

                  {/* Blur/gradient curtain with pitch */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/95 backdrop-blur-[2px]" />
                  </div>

                  {/* Callout card */}
                  <div className="absolute inset-x-0 bottom-6 z-30 px-4">
                    <div className="mx-auto max-w-md rounded-2xl border border-blue-200 bg-white shadow-xl p-4">
                      <div className="text-sm font-semibold text-gray-900">
                        You’re viewing a preview
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        Unlock the complete report: market size, 5-year forecast, competitor list, pricing trends & risks.
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={goToPayment}
                          className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl active:scale-[0.98]"
                        >
                          Unlock full report — ₹{FINAL.toLocaleString("en-IN")}
                        </button>
                        <button
                          onClick={openLead}
                          className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-800 bg-white active:scale-[0.98]"
                        >
                          Get 2-page summary
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
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
        <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 leading-none">Report ID</p>
              <p className="text-sm font-medium text-gray-900 truncate">{reportId || "—"}</p>
            </div>

            {isPurchased ? (
              <div className="ml-auto text-green-700 text-sm font-semibold">✅ Already purchased</div>
            ) : (
              <>
                <div className="ml-2 text-right">
                  <div className="text-[11px] text-gray-500 line-through">₹{MRP.toLocaleString("en-IN")}</div>
                  <div className="text-base font-semibold text-gray-900 leading-tight">₹{FINAL.toLocaleString("en-IN")}</div>
                  <div className="text-[11px] text-green-600">RBideas25 applied</div>
                </div>
                <button onClick={goToPayment} className="ml-auto bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl active:scale-[0.98]">
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
              <p className="success-head">The Report has been successfully sent to</p>
              <p className="success-email">{email}</p>
              <button className="btn btn-primary" onClick={changeStatus}>Ok</button>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Lead Capture Modal */}
      {leadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setLeadOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-blue-100 bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-gray-900">Get a 2-page executive summary</h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              We’ll email/WhatsApp you a short teaser. No spam.
            </p>

            <div className="mt-3 space-y-2">
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="Your email (optional)"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="WhatsApp number (optional)"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {leadMsg && <div className="mt-2 text-xs text-gray-700">{leadMsg}</div>}

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitLead}
                disabled={leadBusy}
                className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-60"
              >
                {leadBusy ? "Sending…" : "Send summary"}
              </button>
              <button
                onClick={goToPayment}
                className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-800 bg-white active:scale-[0.98]"
              >
                Unlock now
              </button>
            </div>

            <div className="mt-2 text-[11px] text-gray-600">
              🔒 Secure UPI/Cards • ✅ 7-day money-back
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsDisplayMobile;

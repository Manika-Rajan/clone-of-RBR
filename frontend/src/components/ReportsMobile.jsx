// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing — logs searches; navigates only if a known report's preview exists.
// If no exact match, calls /suggest (POST) and shows a classic “Did you mean…?” popup (ice-blue).
// If still nothing, offers an Instant vs Pre-Book choice (Razorpay prebook wired; instant placeholder).

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Store } from "../Store";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const POPULAR_REPORTS = [
  "Restaurant Business in India",
  "Paper Industry in India",
  "FMCG Market Report",
  "IT Industry Analysis India",
];

const TRENDING_INDUSTRIES = [
  "EV Charging Business India",
  "Competitor Analysis Pharma",
];

const SUGGESTIONS = [
  "FMCG market report India",
  "IT services market size 2024",
  "Edtech growth forecast",
  "EV charging stations India",
  "D2C beauty market share",
  "Retail POS data India",
  "Consumer behavior FMCG",
  "Pharma competitor analysis",
];

// Router of known reports — navigate only if query clearly matches one of these.
const ROUTER = [
  { slug: "ev_charging", keywords: ["ev charging", "charging station"] },
  { slug: "fmcg", keywords: ["fmcg"] },
  { slug: "pharma", keywords: ["pharma", "pharmaceutical"] },
  // No plain "paper" (so "paper clip" doesn’t auto-resolve)
  { slug: "paper_industry", keywords: ["paper industry", "paper manufacturing"] },
];

// Endpoints
const SEARCH_LOG_URL =
  "https://ypoucxtxgh.execute-api.ap-south-1.amazonaws.com/default/search-log";
const PRESIGN_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL";
const SUGGEST_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/suggest";

// When no report exists, we can still log a “create this report” request
const REQUEST_REPORT_URL =
  "https://sicgpldzo8.execute-api.ap-south-1.amazonaws.com/report-request";

// ⭐ Pre-booking API base
const PREBOOK_API_BASE =
  process.env.REACT_APP_PREBOOK_API_BASE ||
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod";

// ⭐ Single Pre-booking API URL (same path for create + confirm)
const PREBOOK_API_URL = `${PREBOOK_API_BASE}/prebook/create-order`;

// ⭐ Instant Report APIs (customer flow)
// ✅ Env helper: supports both Vite (import.meta.env) and CRA/Webpack (process.env)
const getEnv = (key) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key] != null) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== "undefined" && process?.env?.[key] != null) {
      return process.env[key];
    }
  } catch {}
  return "";
};

// Configure these in Amplify env vars.
// Recommended for Vite builds: VITE_INSTANT_CREATE_ORDER_URL / VITE_INSTANT_CONFIRM_GENERATE_URL / VITE_STATUS_API
// CRA fallback supported: REACT_APP_INSTANT_CREATE_ORDER_URL / REACT_APP_INSTANT_CONFIRM_GENERATE_URL / REACT_APP_INSTANT_STATUS_URL
const INSTANT_API_BASE =
  getEnv("VITE_INSTANT_API_BASE") || getEnv("REACT_APP_INSTANT_API_BASE") || "";

const INSTANT_CREATE_ORDER_URL =
  getEnv("VITE_INSTANT_CREATE_ORDER_URL") ||
  getEnv("REACT_APP_INSTANT_CREATE_ORDER_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/create-order` : "") ||
  // ✅ Safe prod default (from your test page)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/create-order";

const INSTANT_CONFIRM_GENERATE_URL =
  getEnv("VITE_INSTANT_CONFIRM_GENERATE_URL") ||
  getEnv("VITE_CONFIRM_API") ||
  getEnv("REACT_APP_INSTANT_CONFIRM_GENERATE_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/confirm` : "") ||
  // ✅ Safe prod default (from your test page)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/confirm";

const INSTANT_STATUS_URL =
  getEnv("VITE_INSTANT_STATUS_URL") ||
  getEnv("VITE_STATUS_API") ||
  getEnv("REACT_APP_INSTANT_STATUS_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/status` : "") ||
  // ✅ Safe prod default (from employee lab env)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/status";
const INSTANT_DEFAULT_QUESTIONS = [
  "What is the current market overview and market size, with recent trends?",
  "What are the key segments/sub-segments and how is demand distributed?",
  "What are the main growth drivers, constraints, risks, and challenges?",
  "Who are the key players and what is the competitive landscape?",
  "What is the 3–5 year outlook with opportunities and recommendations?",
];

// ✅ Google Ads conversion for PREBOOK (₹499) — hardcoded
const PREBOOK_CONV_SEND_TO = "AW-824378442/X8klCKyRw9EbEMqIjIkD";
// ✅ Google Ads conversion for INSTANT (₹199)
const INSTANT_CONV_SEND_TO = "AW-824378442/6TR6CLvQ1-kbEMqIjIkD";

// ✅ Search input max length
const MAX_QUERY_CHARS = 50;

// Fire Google Ads conversion safely (once per paymentId)
function fireGoogleAdsPrebookConversion({ paymentId, valueINR }) {
  try {
    if (!paymentId) return;

    const guardKey = `ads_prebook_conv_fired_${paymentId}`;
    if (sessionStorage.getItem(guardKey)) {
      console.log("[Ads] Prebook conversion already fired for", paymentId);
      return;
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: PREBOOK_CONV_SEND_TO,
        value: Number(valueINR) || 499.0,
        currency: "INR",
        transaction_id: paymentId, // use Razorpay payment_id as transaction id
      });
      sessionStorage.setItem(guardKey, "1");
      console.log("[Ads] Prebook conversion fired:", { paymentId, valueINR });
    } else {
      console.warn("[Ads] gtag not available; skip prebook conversion fire.");
    }
  } catch (e) {
    console.error("[Ads] Prebook conversion fire error:", e);
  }
}

// Fire Google Ads conversion safely (once per paymentId) — Instant ₹199
function fireGoogleAdsInstantConversion({ paymentId, valueINR = 199 }) {
  try {
    // ✅ Prevent firing the same conversion multiple times per payment
    const key = `rbr_ads_conv_instant_${paymentId || "na"}`;
    if (paymentId && sessionStorage.getItem(key) === "1") return;

    const sendTo = "AW-824378442/6TR6CLvQ1-kbEMqIjIkD";
    const conversionValue = Number(valueINR) || 199;

    const attemptFire = () => {
      if (typeof window.gtag !== "function") return false;

      window.gtag("event", "conversion", {
        send_to: sendTo,
        value: conversionValue,
        currency: "INR",
        transaction_id: paymentId || undefined,
      });

      if (paymentId) sessionStorage.setItem(key, "1");
      return true;
    };

    // Try immediately
    if (attemptFire()) return;

    // Retry briefly in case the tag script is still loading
    const started = Date.now();
    const retry = () => {
      if (attemptFire()) return;
      if (Date.now() - started > 2000) {
        console.warn("[GoogleAds] gtag not ready; conversion not fired", {
          paymentId,
          sendTo,
        });
        return;
      }
      setTimeout(retry, 120);
    };
    retry();
  } catch (e) {
    console.warn("Google Ads conversion fire failed (instant)", e);
  }
}

// ⭐ Razorpay loader
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (document.getElementById(RAZORPAY_SCRIPT_ID)) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(
        new Error("Razorpay SDK failed to load. Please refresh and try again.")
      );
    document.body.appendChild(script);
  });

// Loader
const LoaderRing = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 animate-spin-slow">
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#e6e6e6"
      strokeWidth="8"
    />
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#0263c7"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="283"
      strokeDashoffset="75"
    />
    <style>{`.animate-spin-slow{animation:spin 1.4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

// ✅ helper: bold known quoted parts in the generic-search hint
const renderGenericHint = (query) => (
  <span>
    Your search <strong>“{query}”</strong> is too generic and matches thousands
    of reports. Please try searching specific reports like{" "}
    <strong>“Paper industry”</strong> or <strong>“Restaurant industry”</strong>.
  </span>
);

const ReportsMobile = () => {
  const store = useContext(Store);
  const state = store?.state;
  const dispatch = store?.dispatch;
  const navigate = useNavigate();

  const [q, setQ] = useState("");


  // ⭐ Sample Reports modal
  const [samplesOpen, setSamplesOpen] = useState(false);

  // ⭐ Sample reports -> open preview in embedded PDF viewer
  const [samplePreviewMode, setSamplePreviewMode] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");

  // ✅ modal now supports rich JSX content
  const [openModal, setOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("📊 Rajan Business Reports");
  const [modalMsgNode, setModalMsgNode] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);

  // ⭐ new: loading for pre-booking/payment flow
  const [prebookLoading, setPrebookLoading] = useState(false);

  // ✅ Retry modal state + context (same details used for retry)
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryCtx, setRetryCtx] = useState(null);

  // Suggestion modal (classic)
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState([]);
  const [lastQuery, setLastQuery] = useState("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({
    left: 0,
    top: 0,
    width: 0,
  });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalBtnRef = useRef(null);

  // ⭐ Choose report modal state (Instant vs Pre-book)
  const [prebookPromptOpen, setPrebookPromptOpen] = useState(false);
  const [prebookQuery, setPrebookQuery] = useState("");
  const [prebookName, setPrebookName] = useState("");
  const [prebookPhone, setPrebookPhone] = useState("");
  const [prebookError, setPrebookError] = useState("");
  const [instantChooserError, setInstantChooserError] = useState("");
  const [prebookHasKnownUser, setPrebookHasKnownUser] = useState(false);

  // ======================
  // ✅ OTP Modal (for Instant) — reuse same OTP system as Login.jsx
  // ======================
  const SEND_OTP_API =
    getEnv("VITE_SEND_OTP_API") ||
    getEnv("REACT_APP_SEND_OTP_API") ||
    "https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp";

  const VERIFY_OTP_API =
    getEnv("VITE_VERIFY_OTP_API") ||
    getEnv("REACT_APP_VERIFY_OTP_API") ||
    "https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp";

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState(""); // 10-digit
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const pendingInstantRef = useRef(null);
  const pendingChooserSnapshotRef = useRef(null);

  // ✅ Inline OTP step (instead of a second big popup)
  const [instantOtpStep, setInstantOtpStep] = useState(false);
  const OTP_LEN = 6; // change to 4 later if your OTP becomes 4-digit
  const otpBoxesRef = useRef([]);

  // ======================
  // ✅ Instant Report UI State (customer flow)
  // ======================
  const [instantQuestionsOpen, setInstantQuestionsOpen] = useState(false);
  const [showInstantPaymentSuccess, setShowInstantPaymentSuccess] =
    useState(false);
  const [instantTopic, setInstantTopic] = useState("");
  const [instantQuestions, setInstantQuestions] = useState(
    INSTANT_DEFAULT_QUESTIONS
  );
  const [instantError, setInstantError] = useState("");
  const [instantPayCtx, setInstantPayCtx] = useState(null);

  // Loading modal (employee-portal style)
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [instantModalTitle, setInstantModalTitle] =
    useState("Generating report…");
  const [instantModalSub, setInstantModalSub] = useState("Initializing…");
  const [instantProgressPct, setInstantProgressPct] = useState(5);
  const [instantBusy, setInstantBusy] = useState(false);

  const instantMountedRef = useRef(true);
  const instantAbortRef = useRef({ aborted: false });

  useEffect(() => {
    instantMountedRef.current = true;
    return () => {
      instantMountedRef.current = false;
      instantAbortRef.current.aborted = true;
    };
  }, []);

  // ✅ When OTP inline step opens, focus the first empty box
  useEffect(() => {
    if (!instantOtpStep) return;
    const t = setTimeout(() => {
      const current = String(otpValue || "").replace(/\D/g, "");
      const idx = Math.min(current.length, OTP_LEN - 1);
      const el = otpBoxesRef.current?.[idx];
      if (el && typeof el.focus === "function") el.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [instantOtpStep, otpValue, OTP_LEN]);

  const updateInstantQuestion = (i, val) => {
    setInstantQuestions((prev) => prev.map((q, idx) => (idx === i ? val : q)));
  };

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { res, data };
  }

  function buildErrorMessage(res, data, fallback) {
    return (
      data?.error ||
      data?.message ||
      data?.details ||
      (typeof data?.raw === "string" && data.raw.slice(0, 300)) ||
      fallback ||
      `HTTP ${res?.status || "error"}`
    );
  }

  // ✅ show error if query too long
  const showTooLongError = () => {
    setModalTitle("Search word too long");
    setModalMsgNode(
      <span>
        Your search is too long. Please keep it within{" "}
        <strong>{MAX_QUERY_CHARS}</strong> characters.
      </span>
    );
    setOpenModal(true);
  };

  const matches = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (v.length < 2) return [];
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(v)).slice(0, 6);
  }, [q]);

  const computeDropdownPos = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownRect({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
      width: rect.width,
    });
  }, []);

  const resolveSlug = (query) => {
    const ql = query.toLowerCase();
    for (const entry of ROUTER) {
      if (entry.keywords.some((kw) => ql.includes(kw))) return entry.slug;
    }
    return null;
  };

  const fetchSuggestions = async (query) => {
    try {
      const resp = await fetch(SUGGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, limit: 3 }),
      });
      if (!resp.ok) return { items: [], exact_match: false, hint: "" };
      const data = await resp.json();
      const body = typeof data.body === "string" ? JSON.parse(data.body) : data;
      const items = (body.items || []).slice(0, 3);
      const hint = body.hint || "";
      return { items, exact_match: !!body.exact_match, hint };
    } catch (e) {
      console.error("suggest error:", e);
      return { items: [], exact_match: false, hint: "" };
    }
  };

  const requestNewReport = async (query) => {
    if (!REQUEST_REPORT_URL) return;
    try {
      const payload = {
        search_query: query,
        user: {
          name: state?.userInfo?.name || "Unknown",
          email: state?.userInfo?.email || "",
          phone: state?.userInfo?.phone || "",
          userId: state?.userInfo?.userId || state?.userInfo?.phone || "",
        },
      };
      const resp = await fetch(REQUEST_REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("requestNewReport failed:", resp.status, txt);
      }
    } catch (e) {
      console.error("requestNewReport error:", e);
    }
  };

  // ✅ open Razorpay with an existing order (used for both first attempt and retry)
  const openRazorpayForPrebook = async ({
    prebookId,
    razorpayOrderId,
    amount,
    currency,
    razorpayKeyId,
    trimmed,
    userName,
    userPhone,
  }) => {
    try {
      await loadRazorpay();
      if (!window.Razorpay) {
        setModalTitle("Payment error");
        setModalMsgNode(
          <span>
            ⚠️ Payment SDK did not load properly. Please refresh and try again.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Pre-book ₹499 (Adjusted): ${trimmed} | Access in My Profile`,
        order_id: razorpayOrderId,
        prefill: { name: userName || "RBR User", contact: userPhone },
        notes: {
          type: "prebook",
          prebookId,
          reportTitle: trimmed,
          searchQuery: trimmed,
        },

        handler: async (response) => {
          // Payment success → show a quick success popup (1s) so the conversion tag has time to fire,
          // then ask 5 questions for the Instant report.
          const payId = response?.razorpay_payment_id;
          const sig = response?.razorpay_signature;

          setShowInstantPaymentSuccess(true);

          // ✅ Google Ads conversion: Instant purchase
          fireGoogleAdsInstantConversion({
            paymentId: payId,
            valueINR: 199,
          });

          // After 1s, proceed to the questions modal
          setTimeout(() => {
            setShowInstantPaymentSuccess(false);

            setInstantError("");
            setInstantTopic(trimmed);
            setInstantQuestions(INSTANT_DEFAULT_QUESTIONS);
            setInstantPayCtx({
              userPhone: (userPhone || "").replace(/\D/g, ""),
              userName: (userName || "").trim() || "RBR User",
              query: trimmed,
              razorpayOrderId,
              razorpayPaymentId: payId,
              razorpaySignature: sig,
            });
            setInstantQuestionsOpen(true);
          }, 1000);
        },
        modal: {
          ondismiss: () => {
            setPrebookLoading(false);
            setRetryCtx({
              prebookId,
              razorpayOrderId,
              amount,
              currency,
              razorpayKeyId,
              trimmed,
              userName,
              userPhone,
            });
            setRetryOpen(true);
          },
        },

        theme: { color: "#0263c7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("openRazorpayForPrebook error:", e);
      setModalTitle("Payment error");
      setModalMsgNode(
        <span>
          ⚠️ Could not open payment right now. Please try again in a few minutes.
        </span>
      );
      setOpenModal(true);
    }
  };

  const retryPrebookPayment = async () => {
    if (!retryCtx) return;
    setRetryOpen(false);
    setPrebookLoading(true);
    try {
      await openRazorpayForPrebook(retryCtx);
    } finally {
      setPrebookLoading(false);
    }
  };

  const startPrebookFlow = async (query, userName, userPhoneRaw) => {
    const trimmed = query.trim();
    const userPhone = (userPhoneRaw || "").trim();

    if (!trimmed || !userPhone) {
      setModalTitle("Missing details");
      setModalMsgNode(
        <span>
          ⚠️ Missing details for pre-booking. Please enter a valid name and
          phone.
        </span>
      );
      setOpenModal(true);
      return;
    }

    if (!PREBOOK_API_URL) {
      console.error("PREBOOK_API_URL is not configured");
      setModalTitle("Pre-booking unavailable");
      setModalMsgNode(
        <span>
          ⚠️ Pre-booking is temporarily unavailable. Please try again in a few
          minutes.
        </span>
      );
      setOpenModal(true);
      return;
    }

    setPrebookLoading(true);
    try {
      const resp = await fetch(PREBOOK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone,
          userName: userName || "RBR User",
          reportTitle: trimmed,
          searchQuery: trimmed,
          notes: "",
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("prebook create-order failed", resp.status, text);
        setPrebookLoading(false);
        setModalTitle("Pre-booking error");
        setModalMsgNode(
          <span>
            ⚠️ Could not start the pre-booking right now. Please try again in a
            few minutes.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const data = await resp.json();
      const { prebookId, razorpayOrderId, amount, currency, razorpayKeyId } =
        data || {};

      if (!prebookId || !razorpayOrderId || !razorpayKeyId) {
        console.error("Invalid prebook response:", data);
        setPrebookLoading(false);
        setModalTitle("Pre-booking error");
        setModalMsgNode(
          <span>
            ⚠️ Something went wrong while preparing the payment. Please try
            again.
          </span>
        );
        setOpenModal(true);
        return;
      }

      setRetryCtx({
        prebookId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
        trimmed,
        userName: userName || "RBR User",
        userPhone,
      });

      setPrebookLoading(false);
      await openRazorpayForPrebook({
        prebookId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
        trimmed,
        userName: userName || "RBR User",
        userPhone,
      });
    } catch (e) {
      console.error("startPrebookFlow error:", e);
      setPrebookLoading(false);
      setModalTitle("Pre-booking error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while starting the pre-booking. Please try
          again later.
        </span>
      );
      setOpenModal(true);
    }
  };

  // ✅ Open the “Choose report type” modal
  const triggerPrebook = async (query) => {
    const trimmed = query.trim();
    const savedPhone = state?.userInfo?.phone || state?.userInfo?.userId || "";
    const savedName = state?.userInfo?.name || "";

    setPrebookQuery(trimmed);
    setPrebookName(savedName);
    setPrebookPhone(savedPhone);
    setPrebookHasKnownUser(!!savedPhone);
    setPrebookError("");
    setInstantChooserError("");
    setPrebookPromptOpen(true);
  };

  // ✅ Instant report (₹199) — Payment first, then ask 5 questions, then generate with loading modal
  // ✅ FORCE name/phone confirmation for NEW users: if no saved phone -> fields are shown in the chooser modal.
  const sendOtpForInstant = async (phone10) => {
    const digits = String(phone10 || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return false;
    }

    setOtpError("");
    setOtpSending(true);
    try {
      const phoneE164 = `+91${digits}`;

      // mirror Login.jsx payload
      const resp = await fetch(SEND_OTP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneE164 }),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data?.message || "Could not send OTP. Please try again.");
      }

      // Optional: keep Store phone in sync (same as Login.jsx)
      try {
        dispatch?.({ type: "SET_PHONE", payload: phoneE164 });
      } catch {}

      setOtpSent(true);
      return true;
    } catch (e) {
      setOtpError(e?.message || "Could not send OTP. Please try again.");
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtpForInstant = async () => {
    const digits = String(otpPhone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    const code = String(otpValue || "").trim();
    if (!code) {
      setOtpError("Please enter the OTP.");
      return false;
    }

    setOtpError("");
    setOtpVerifying(true);
    try {
      const phoneE164 = `+91${digits}`;

      // mirror Login.jsx payload
      const resp = await fetch(VERIFY_OTP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneE164, otp: code }),
      });

      const raw = await resp.text();
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = {};
      }

      // Some lambdas return { body: "{...}" }
      let body = parsed;
      if (typeof parsed?.body === "string") {
        try {
          body = JSON.parse(parsed.body);
        } catch {
          body = {};
        }
      }

      if (!resp.ok) {
        throw new Error(
          body?.message || parsed?.message || "Invalid OTP. Please try again."
        );
      }

      const token = body?.token || parsed?.token || "";
      const baseUser = {
        isLogin: true,
        userId: phoneE164,
        phone: phoneE164,
        token,
      };

      // Persist like Login.jsx
      try {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userInfo", JSON.stringify(baseUser));
      } catch {}

      try {
        dispatch?.({ type: "USER_LOGIN", payload: baseUser });
      } catch {}

      return true;
    } catch (e) {
      setOtpError(e?.message || "Invalid OTP. Please try again.");
      return false;
    } finally {
      setOtpVerifying(false);
    }
  };

  // ======================
  // ✅ OTP boxes helpers (inline)
  // ======================
  const otpDigits = useMemo(() => {
    const raw = String(otpValue || "");
    const onlyNums = raw.replace(/\D/g, "");
    const padded = (onlyNums + "".padEnd(OTP_LEN, " ")).slice(0, OTP_LEN);
    return padded.split("").map((c) => (c === " " ? "" : c));
  }, [otpValue, OTP_LEN]);

  const setOtpAt = (idx, digit) => {
    const d = String(digit || "").replace(/\D/g, "").slice(0, 1);
    const arr = [...otpDigits];
    arr[idx] = d;
    setOtpValue(arr.join(""));
  };

  const focusOtp = (idx) => {
    const el = otpBoxesRef.current?.[idx];
    if (el && typeof el.focus === "function") el.focus();
  };

  const onOtpChange = (idx, e) => {
    const val = e.target.value;
    const digits = String(val || "").replace(/\D/g, "");
    if (!digits) {
      setOtpAt(idx, "");
      return;
    }

    // If user pasted multiple digits into one box
    if (digits.length > 1) {
      const take = digits.slice(0, OTP_LEN - idx).split("");
      const arr = [...otpDigits];
      take.forEach((ch, k) => {
        arr[idx + k] = ch;
      });
      setOtpValue(arr.join(""));
      const next = Math.min(idx + take.length, OTP_LEN - 1);
      focusOtp(next);
      return;
    }

    setOtpAt(idx, digits);
    if (idx < OTP_LEN - 1) focusOtp(idx + 1);
  };

  const onOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        setOtpAt(idx, "");
      } else if (idx > 0) {
        focusOtp(idx - 1);
        setOtpAt(idx - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) focusOtp(idx - 1);
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) focusOtp(idx + 1);
  };

  const onOtpPaste = (e) => {
    try {
      const txt = e.clipboardData?.getData("text") || "";
      const digits = txt.replace(/\D/g, "").slice(0, OTP_LEN);
      if (!digits) return;
      e.preventDefault();
      const arr = Array.from({ length: OTP_LEN }, (_, i) => digits[i] || "");
      setOtpValue(arr.join(""));
      const lastFilled = Math.min(digits.length - 1, OTP_LEN - 1);
      focusOtp(Math.max(0, lastFilled));
    } catch {}
  };

  const startInstantPayment = async ({ query, userName, phoneDigits }) => {
    const trimmed = (query || "").trim();
    const nm = (userName || "RBR User").trim() || "RBR User";

    // Ensure Instant endpoints exist
    if (
      !INSTANT_CREATE_ORDER_URL ||
      !INSTANT_CONFIRM_GENERATE_URL ||
      !INSTANT_STATUS_URL
    ) {
      setModalTitle("Instant setup incomplete");
      setModalMsgNode(
        <span>⚠️ Instant report setup is incomplete. Please try again later.</span>
      );
      setOpenModal(true);
      return;
    }

    try {
      setPrebookLoading(true);

      // 1) Create Razorpay order for Instant
      const { res, data } = await fetchJson(INSTANT_CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone: phoneDigits,
          userName: nm,
          query: trimmed,
          amount: 199,
          currency: "INR",
          type: "instant",
        }),
      });

      if (!res.ok || data?.ok === false) {
        throw new Error(
          buildErrorMessage(res, data, "Could not start Instant payment")
        );
      }

      // Accept multiple response shapes
      const razorpayOrderId =
        data?.razorpayOrderId ||
        data?.razorpay_order_id ||
        data?.orderId ||
        data?.order_id;
      const razorpayKeyId =
        data?.razorpayKeyId ||
        data?.razorpay_key_id ||
        data?.keyId ||
        data?.key_id;
      const amount = data?.amount || 19900; // paise usually
      const currency = data?.currency || "INR";

      if (!razorpayOrderId || !razorpayKeyId) {
        console.error("Instant create-order response:", data);
        throw new Error(
          "Instant payment could not be prepared. Missing Razorpay order/key."
        );
      }

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment SDK did not load");

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Instant ₹199: ${trimmed}`,
        order_id: razorpayOrderId,
        prefill: { name: nm, contact: phoneDigits },
        notes: {
          type: "instant",
          reportTitle: trimmed,
          searchQuery: trimmed,
          userPhone: phoneDigits,
        },
        handler: async (response) => {
          // Payment success → now ask 5 questions
          const payId = response?.razorpay_payment_id;
          const sig = response?.razorpay_signature;

          // ✅ Google Ads conversion: Instant purchase
          fireGoogleAdsInstantConversion({
            paymentId: payId,
            valueINR: 199,
          });

          setInstantError("");
          setInstantTopic(trimmed);
          setInstantQuestions(INSTANT_DEFAULT_QUESTIONS);
          setInstantPayCtx({
            userPhone: phoneDigits,
            userName: nm,
            query: trimmed,
            razorpayOrderId,
            razorpayPaymentId: payId,
            razorpaySignature: sig,
          });
          setInstantQuestionsOpen(true);
        },
        modal: {
          ondismiss: () => {
            setPrebookLoading(false);
            setModalTitle("Payment cancelled");
            setModalMsgNode(
              <span>
                Your payment was cancelled. You can try again, or choose{" "}
                <strong>Pre-book</strong> instead.
              </span>
            );
            setOpenModal(true);
          },
        },
        theme: { color: "#0263c7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Instant trigger error:", e);
      setModalTitle("Payment error");
      setModalMsgNode(
        <span>
          ⚠️ Could not start Instant payment. Please try again in a few minutes.
        </span>
      );
      setOpenModal(true);
    } finally {
      setPrebookLoading(false);
    }
  };

  const triggerInstant = async (query) => {
    const trimmed = (query || "").trim();

    // If popup isn't open yet (rare path) ensure it opens with query filled
    if (!prebookPromptOpen) {
      const savedPhone = state?.userInfo?.phone || state?.userInfo?.userId || "";
      const savedName = state?.userInfo?.name || "";
      setPrebookQuery(trimmed);
      setPrebookName(savedName);
      setPrebookPhone(savedPhone);
      setPrebookHasKnownUser(!!savedPhone);
      setPrebookError("");
      setInstantChooserError("");
      setPrebookPromptOpen(true);
      return;
    }

    // Validate name/phone for BOTH known + new (known users may still have bad saved phone)
    let nm = (prebookName || "").trim();
    const phoneDigits = (prebookPhone || "").replace(/\D/g, "");

    if (!nm) nm = "RBR User";
    if (phoneDigits.length < 10) {
      setInstantChooserError(
        prebookHasKnownUser
          ? "Your saved phone number seems invalid. Please update your profile or contact us."
          : "Please enter a valid phone number (at least 10 digits)."
      );
      setPrebookError("");
      return;
    }

    if (!prebookHasKnownUser && !(prebookName || "").trim()) {
      setInstantChooserError("Please enter your name to continue.");
      setPrebookError("");
      return;
    }

    setPrebookError("");
    setInstantChooserError("");

    // If already logged in, go straight to payment.
    const alreadyLoggedIn = !!state?.userInfo?.isLogin;
    if (alreadyLoggedIn) {
      setPrebookPromptOpen(false);
      await startInstantPayment({ query: trimmed, userName: nm, phoneDigits });
      return;
    }

    // Otherwise: OTP before payment (Option A)
    pendingInstantRef.current = { query: trimmed, userName: nm, phoneDigits };
    pendingChooserSnapshotRef.current = {
      prebookQuery: trimmed,
      prebookName: nm,
      prebookPhone: phoneDigits,
      prebookHasKnownUser,
    };

    // ✅ NEW UX: keep the chooser modal open and show OTP inline (no second popup)
    setOtpPhone(phoneDigits.slice(-10));
    setOtpValue("");
    setOtpError("");
    setOtpSent(false);
    setInstantOtpStep(true);

    // Auto-send OTP on step open
    setTimeout(() => {
      sendOtpForInstant(phoneDigits);
    }, 0);
  };

  const cancelInstantOtp = () => {
    // Return to chooser inputs inside the same modal
    setInstantOtpStep(false);
    setOtpError("");
    setOtpValue("");
    setOtpSent(false);

    // Re-open chooser so the user can edit name/phone or pick Pre-book
    const snap = pendingChooserSnapshotRef.current;
    if (snap) {
      setPrebookQuery(snap.prebookQuery || "");
      setPrebookName(snap.prebookName || "");
      setPrebookPhone(snap.prebookPhone || "");
      setPrebookHasKnownUser(!!snap.prebookHasKnownUser);
    }
    setPrebookError("");
    setInstantChooserError("");
    setPrebookPromptOpen(true);
  };

  const verifyOtpAndProceedInstant = async () => {
    const ok = await verifyOtpForInstant();
    if (!ok) return;

    setInstantOtpStep(false);
    setPrebookPromptOpen(false);

    const pending = pendingInstantRef.current;
    pendingInstantRef.current = null;
    if (pending) {
      await startInstantPayment(pending);
    } else {
      setModalTitle("Something went wrong");
      setModalMsgNode(
        <span>⚠️ We couldn’t continue the Instant flow. Please try again.</span>
      );
      setOpenModal(true);
    }
  };

  const goToReportBySlug = async (reportSlug) => {
    if (!reportSlug) return;
    setSearchLoading(true);
    try {
      const reportId = `RBR1${Math.floor(Math.random() * 900 + 100)}`;
      const previewKey = `${reportSlug}_preview.pdf`;

      const presignResp = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_key: previewKey }),
      });

      if (!presignResp.ok) {
        setModalTitle("Preview not ready");
        setModalMsgNode(
          <span>
            📢 This report preview isn’t ready yet. Our team is adding it
            shortly.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const presignData = await presignResp.json();
      const url = presignData?.presigned_url;
      if (!url) {
        setModalTitle("Preview not ready");
        setModalMsgNode(
          <span>
            📢 This report preview isn’t ready yet. Please check back soon.
          </span>
        );
        setOpenModal(true);
        return;
      }

      try {
        const probe = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
        });
        const ct = (probe.headers.get("content-type") || "").toLowerCase();
        if (
          !probe.ok ||
          !(probe.status === 200 || probe.status === 206) ||
          !ct.includes("pdf")
        ) {
          setModalTitle("Preview not ready");
          setModalMsgNode(
            <span>
              📢 This report preview isn’t ready yet. Please check back soon.
            </span>
          );
          setOpenModal(true);
          return;
        }
      } catch {}

      if (samplePreviewMode) {
        setPdfViewerUrl(url);
        setPdfViewerOpen(true);
        setSamplePreviewMode(false);
        return;
      }

      navigate("/report-display", { state: { reportSlug, reportId } });
    } catch (e) {
      console.error("goToReportBySlug error:", e);
      setModalTitle("Error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while opening the report. Please try again.
        </span>
      );
      setOpenModal(true);
    } finally {
      setSearchLoading(false);
      // Safety: reset sample mode if something failed mid-way
      setSamplePreviewMode(false);
    }
  };

  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // ✅ hard stop if query exceeds max chars
    if (trimmed.length > MAX_QUERY_CHARS) {
      showTooLongError();
      return;
    }

    setLastQuery(trimmed);
    setSearchLoading(true);
    setModalMsgNode(null);
    setSuggestOpen(false);

    try {
      window.gtag?.("event", "report_search", {
        event_category: "engagement",
        event_label: "mobile_reports_search",
        value: 1,
        search_term: trimmed,
      });

      const payload = {
        search_query: trimmed,
        user: {
          name: state?.userInfo?.name || "Unknown",
          email: state?.userInfo?.email || "",
          phone: state?.userInfo?.phone || "",
          userId: state?.userInfo?.userId || state?.userInfo?.phone || "",
        },
      };

      const logResp = await fetch(SEARCH_LOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!logResp.ok) {
        const t = await logResp.text();
        throw new Error(`Failed search-log ${logResp.status}, body: ${t}`);
      }
      await logResp.json();

      const { items, hint } = await fetchSuggestions(trimmed);

      if (items && items.length > 0) {
        const mapped = items.map((it) => ({
          title: it.title || it.slug,
          slug: it.slug,
        }));
        setSuggestItems(mapped.slice(0, 3));
        setSuggestOpen(true);
        return;
      }

      // ✅ if lambda returns hint for generic searches, show message
      if (hint) {
        setModalTitle("Search too generic");
        setModalMsgNode(renderGenericHint(trimmed));
        setOpenModal(true);
        return;
      }

      // fallback to hard router
      const reportSlug = resolveSlug(trimmed);
      if (reportSlug) {
        await goToReportBySlug(reportSlug);
        return;
      }

      await requestNewReport(trimmed);
      await triggerPrebook(trimmed);
      return;
    } catch (e) {
      console.error("Error during search flow:", e);
      setModalTitle("Error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while processing your request. Please try
          again later.
        </span>
      );
      setOpenModal(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (searchLoading) return;

    const query = q.trim();
    if (!query) return;

    // ✅ hard stop if query exceeds max chars
    if (query.length > MAX_QUERY_CHARS) {
      setShowSuggestions(false);
      showTooLongError();
      return;
    }

    setShowSuggestions(false);
    handleSearch(query);
  };

  const closeModal = () => {
    setOpenModal(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFocus = () => {
    computeDropdownPos();
    setShowSuggestions(true);
  };

  useEffect(() => {
    const handleClick = (e) => {
      const insideDropdown = dropdownRef.current?.contains(e.target);
      const insideInput = inputRef.current?.contains(e.target);
      if (!insideDropdown && !insideInput) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  useEffect(() => {
    const onResize = () => computeDropdownPos();
    const onScroll = () => setShowSuggestions(false);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [computeDropdownPos]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        if (suggestOpen) setSuggestOpen(false);
        if (openModal) setOpenModal(false);
        if (prebookPromptOpen) setPrebookPromptOpen(false);
        if (retryOpen) setRetryOpen(false);
        if (otpOpen) setOtpOpen(false);
        if (instantQuestionsOpen) setInstantQuestionsOpen(false);
      }
    };
    if (
      openModal ||
      suggestOpen ||
      prebookPromptOpen ||
      retryOpen ||
      otpOpen ||
      instantQuestionsOpen
    ) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, suggestOpen, prebookPromptOpen, retryOpen, otpOpen, instantQuestionsOpen]);

  // ✅ Safety: if chooser modal closes, also exit OTP inline step
  useEffect(() => {
    if (prebookPromptOpen) return;
    if (instantOtpStep) setInstantOtpStep(false);
    // keep otpPhone (it can help future tries), but clear code/error
    setOtpError("");
    setOtpValue("");
    setOtpSent(false);
  }, [prebookPromptOpen]);

  async function pollInstantUntilDone({ userPhone, instantId }) {
    const MAX_WAIT_MS = 120000; // 2 minutes
    const POLL_EVERY_MS = 2500; // 2.5s

    const startedAt = Date.now();
    instantAbortRef.current.aborted = false;

    if (!instantMountedRef.current) return null;

    setInstantModalOpen(true);
    setInstantModalTitle("Generating report…");
    setInstantModalSub("Queued. Starting worker…");
    setInstantProgressPct(8);

    // Smooth progress animation up to 92%
    const timer = setInterval(() => {
      if (!instantMountedRef.current) return;
      setInstantProgressPct((p) => {
        if (p >= 92) return p;
        return Math.min(92, p + 1);
      });
    }, 900);

    try {
      while (Date.now() - startedAt < MAX_WAIT_MS) {
        if (!instantMountedRef.current) throw new Error("Page closed");
        if (instantAbortRef.current.aborted) throw new Error("Polling aborted");

        const url = new URL(INSTANT_STATUS_URL);
        url.searchParams.set("userPhone", userPhone);
        url.searchParams.set("instantId", instantId);

        const { res, data } = await fetchJson(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok || data?.ok === false) {
          throw new Error(buildErrorMessage(res, data, "Status check failed"));
        }

        const status = String(data?.status || "").toLowerCase();

        if (status === "done") {
          setInstantModalSub("Finalizing…");
          setInstantProgressPct(95);
          return data;
        }

        if (status === "failed") {
          throw new Error(
            data?.error || data?.details || "Report generation failed"
          );
        }

        setInstantModalSub(
          status === "running"
            ? "Generating content and charts…"
            : "Queued… waiting for worker"
        );

        await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
      }

      throw new Error(
        `Still running after ${Math.round(
          MAX_WAIT_MS / 1000
        )}s. Please wait and check in My Profile.`
      );
    } finally {
      clearInterval(timer);
    }
  }

  async function generateInstantNow() {
    if (instantBusy) return;

    const ctx = instantPayCtx;
    const t = (instantTopic || "").trim();
    const qs = (instantQuestions || []).map((x) => (x || "").trim());

    if (!ctx || !ctx.userPhone || !ctx.razorpayOrderId) {
      setInstantError("Missing payment context. Please try again.");
      return;
    }

    if (!t) {
      setInstantError("Topic missing. Please close and try again.");
      return;
    }

    if (qs.length !== 5 || qs.some((x) => !x)) {
      setInstantError("Please fill all 5 questions.");
      return;
    }

    if (!INSTANT_CONFIRM_GENERATE_URL || !INSTANT_STATUS_URL) {
      setInstantError("Instant APIs are not configured in production env vars.");
      return;
    }

    setInstantError("");
    setInstantBusy(true);

    try {
      // Close questions modal and begin loading modal
      setInstantQuestionsOpen(false);

      setInstantModalOpen(true);
      setInstantModalTitle("Generating report…");
      setInstantModalSub("Submitting request…");
      setInstantProgressPct(10);

      const payload = {
        userPhone: ctx.userPhone,
        userName: ctx.userName || "RBR User",
        query: ctx.query || t,
        questions: qs,

        razorpayOrderId: ctx.razorpayOrderId,
        razorpayPaymentId: ctx.razorpayPaymentId,
        razorpaySignature: ctx.razorpaySignature,

        type: "instant",
      };

      const { res, data } = await fetchJson(INSTANT_CONFIRM_GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || data?.ok === false) {
        throw new Error(buildErrorMessage(res, data, "Could not start generation"));
      }

      const userPhone = data?.userPhone || data?.user_phone || ctx.userPhone;
      const instantId =
        data?.instantId || data?.instant_id || data?.instant_id || data?.id;

      if (!userPhone || !instantId) {
        console.error("Confirm response:", data);
        throw new Error("Confirm API did not return userPhone + instantId");
      }

      const statusData = await pollInstantUntilDone({ userPhone, instantId });
      if (!statusData || !instantMountedRef.current) return;

      const finalKey =
        statusData?.s3Key ||
        statusData?.s3_key ||
        statusData?.finalS3Key ||
        statusData?.final_s3_key ||
        "";

      setInstantModalSub("Ready!");
      setInstantProgressPct(100);

      setTimeout(() => {
        if (!instantMountedRef.current) return;
        setInstantModalOpen(false);

        // Redirect to profile and highlight latest report (you said highlighting is already in place)
        navigate("/profile", {
          replace: true,
          state: {
            highlightType: "instant",
            highlightFileKey: finalKey,
            highlightQuery: t,
            highlightInstantId: instantId,
            highlightUserPhone: userPhone,
          },
        });
      }, 600);
    } catch (e) {
      console.error("generateInstantNow error:", e);
      setInstantModalOpen(false);

      setModalTitle("Instant report failed");
      setModalMsgNode(
        <span>
          ⚠️ {e?.message || "Something went wrong while generating the report."}
        </span>
      );
      setOpenModal(true);
    } finally {
      setInstantBusy(false);
    }
  }

  const handlePrebookSubmit = async (e) => {
    e.preventDefault();
    setInstantChooserError("");

    if (prebookHasKnownUser) {
      const phoneDigits = (prebookPhone || "").replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        setPrebookError(
          "Your saved phone number seems invalid. Please update your profile or contact us."
        );
        return;
      }
      setPrebookError("");
      setPrebookPromptOpen(false);

      await startPrebookFlow(prebookQuery, prebookName || "RBR User", phoneDigits);
      return;
    }

    const phoneDigits = (prebookPhone || "").replace(/\D/g, "");
    const nm = (prebookName || "").trim();
    if (!nm) {
      setPrebookError("Please enter your name.");
      return;
    }
    if (phoneDigits.length < 10) {
      setPrebookError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setPrebookError("");
    setPrebookPromptOpen(false);

    await startPrebookFlow(prebookQuery, nm || "RBR User", phoneDigits);
  };



// ⭐ Run a sample search using the same form submit flow
const runSampleSearch = (query) => {
  const safe = (query || "").slice(0, MAX_QUERY_CHARS);
  setSamplesOpen(false);
  setShowSuggestions(false);
  setSamplePreviewMode(true);
  setQ(safe);

  // wait for state to apply, then submit the form (triggers existing onSubmit)
  setTimeout(() => {
    try {
      inputRef.current?.focus();
      const form = inputRef.current?.closest("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    } catch (e) {
      // no-op
    }
  }, 60);
};

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-24 pb-10 relative">
{/* Sample Reports */}
<div className="absolute top-1 right-0 sm:right-1">
  <button
    type="button"
    onClick={() => setSamplesOpen(true)}
    className="rounded-full bg-slate-100 text-slate-500 px-4 py-2 text-sm font-medium border border-slate-200 opacity-60 hover:opacity-100 transition"
  >
    View Sample Reports
  </button>
</div>

{/* Hero */}
      <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-3 px-1">
        Get Instant Market &amp; Business Reports
      </h1>
      <p className="text-gray-600 text-center mb-6 text-sm sm:text-base px-2">
        Search 1000+ industry reports. Accurate. Reliable. Ready for your business.
      </p>

      {/* Search */}
      <form onSubmit={onSubmit} className="w-full mb-3">
        <label htmlFor="mobile-search" className="sr-only">
          Search reports
        </label>
        <div className="w-full flex">
          <input
            ref={inputRef}
            id="mobile-search"
            type="text"
            value={q}
            maxLength={MAX_QUERY_CHARS}
            onChange={(e) => {
              const v = e.target.value || "";
              if (v.length <= MAX_QUERY_CHARS) setQ(v);
              else setQ(v.slice(0, MAX_QUERY_CHARS));
            }}
            onFocus={handleFocus}
            placeholder="e.g., paper industry, FMCG, pharma…"
            inputMode="search"
            enterKeyHint="search"
            className="flex-grow px-3 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-blue-600 text-white px-4 py-3 rounded-r-xl font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-60"
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>

        </div>
        
{samplesOpen &&
    createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSamplesOpen(false)}
        />

        {/* modal */}
        <div className="relative w-full max-w-[560px] rounded-3xl border border-white/10 bg-[#0b1220]/95 shadow-2xl">
          {/* glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/15 via-blue-400/10 to-fuchsia-400/15 blur-xl" />

          {/* header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <div className="text-white text-lg font-semibold">Sample Reports</div>
              <div className="text-white/60 text-xs mt-1">
                Click one to open preview
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSamplesOpen(false)}
              className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div className="relative p-4 max-h-[70vh] overflow-auto">
            <div className="mb-4">
              <div className="text-white/70 text-xs font-semibold mb-2">POPULAR REPORTS</div>
              <div className="grid gap-2">
                {POPULAR_REPORTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => runSampleSearch(t)}
                    className="group w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white">{t}</div>
                      <div className="text-white/60 group-hover:text-white">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white/70 text-xs font-semibold mb-2">TRENDING INDUSTRIES</div>
              <div className="grid gap-2">
                {TRENDING_INDUSTRIES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => runSampleSearch(t)}
                    className="group w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white">{t}</div>
                      <div className="text-white/60 group-hover:text-white">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="relative px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-white/50 text-xs">
              Tip: You can edit these samples in the frontend anytime.
            </div>
            <button
              type="button"
              onClick={() => setSamplesOpen(false)}
              className="rounded-full px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

{/* Inline autocomplete suggestions via PORTAL */}
      {showSuggestions &&
        matches.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto rounded-b-xl"
            style={{
              position: "fixed",
              left: dropdownRect.left,
              top: dropdownRect.top,
              width: dropdownRect.width,
            }}
          >
            {matches.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ(m.slice(0, MAX_QUERY_CHARS));
                  setShowSuggestions(false);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {m}
              </button>
            ))}
          </div>,
          document.body
        )}

      </form>


      {/* Loader overlay for search */}
      {searchLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3">
              <LoaderRing />
            </div>
            <div className="text-gray-800 text-sm">Fetching your request…</div>
          </div>
        </div>
      )}

      {/* Loader overlay for pre-booking / payment confirm */}
      {prebookLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3">
              <LoaderRing />
            </div>
            <div className="text-gray-800 text-sm">
              Processing your payment and confirming your pre-booking…
            </div>
          </div>
        </div>
      )}

      {/* ✅ Instant generation loading modal (employee-portal style) */}
      {instantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[92%] max-w-sm">
            <div className="text-base font-extrabold text-gray-900">
              {instantModalTitle}
            </div>
            <div className="text-xs text-gray-600 mt-1">{instantModalSub}</div>

            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-600"
                  style={{
                    width: `${Math.max(0, Math.min(100, instantProgressPct))}%`,
                  }}
                />
              </div>
              <div className="text-right text-[11px] text-gray-600 mt-1">
                {instantProgressPct}%
              </div>
            </div>

            <div className="text-[11px] text-gray-500 mt-3">
              This can take up to ~2 minutes because charts + PDF are generated
              in the worker.
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Retry payment modal (centered + different theme) */}
      {retryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setRetryOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-amber-200 bg-[#FFF7ED] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <span style={{ fontSize: 20 }}>⚠️</span>
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-amber-900">
                  Payment cancelled
                </div>
                <div className="text-xs text-amber-900/70 mt-0.5">
                  No money was taken (in most cases). You can retry immediately.
                </div>
              </div>
              <button
                onClick={() => setRetryOpen(false)}
                className="ml-auto h-8 w-8 rounded-full bg-white/70 hover:bg-white text-amber-800 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-amber-900/80 mb-3 leading-relaxed">
              Your details are saved. Tap <strong>Retry payment</strong> to open
              the payment window again.
            </p>

            <div className="mb-4 rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-amber-900 mb-1">
                After successful pre-booking
              </div>
              <ul className="text-[11px] text-amber-900/80 space-y-1 ml-4 list-disc">
                <li>OTP login to your account</li>
                <li>
                  Report is unlocked in <strong>My Profile</strong> when ready
                </li>
                <li>
                  Delivery within <strong>72 hours</strong>
                </li>
                <li>₹499 is adjusted in final price</li>
              </ul>
            </div>

            <button
              onClick={retryPrebookPayment}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Retry payment
            </button>

            <button
              onClick={() => setRetryOpen(false)}
              className="w-full mt-2 border border-amber-200 hover:border-amber-300 bg-white text-amber-900 font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Generic info / success modal (CENTERED + CUSTOM TITLE + BOLD MESSAGE) */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[92%] sm:w-[420px] bg-white rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">
              {modalTitle || "Search too generic"}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {modalMsgNode || <span>Please try a more specific search.</span>}
            </p>
            <button
              ref={modalBtnRef}
              onClick={closeModal}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Okay
            </button>
          </div>
        </div>
      )}


      {/* 📄 PDF Viewer (used for Sample Reports) */}
      {pdfViewerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setPdfViewerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[96%] sm:w-[820px] h-[82vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="text-slate-900 font-semibold text-sm">
                Sample Report Preview
              </div>
              <button
                type="button"
                onClick={() => setPdfViewerOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="Close PDF"
              >
                ✕
              </button>
            </div>

            <div className="h-[calc(82vh-52px)]">
              {pdfViewerUrl ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer fileUrl={pdfViewerUrl} />
                </Worker>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                  Loading preview…
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ✅ OTP Modal (shown BEFORE Instant payment) */}
      {otpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={cancelInstantOtp}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[420px] rounded-2xl shadow-2xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-white/90 text-xs font-semibold tracking-wide">
                    Verify mobile number
                  </div>
                  <h2 className="text-white text-lg font-extrabold leading-tight mt-1">
                    Enter OTP to continue
                  </h2>
                  <div className="mt-2 text-white/90 text-xs leading-snug">
                    We’ll send an OTP to the number below. After verification,
                    we’ll open the ₹199 payment gateway.
                  </div>
                </div>

                <button
                  onClick={cancelInstantOtp}
                  className="shrink-0 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 pt-4 pb-5">
              {otpError ? (
                <div className="mb-3 text-sm text-red-600 font-semibold">
                  {otpError}
                </div>
              ) : null}

              <label className="text-xs font-bold text-gray-800">
                Mobile number
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 text-gray-800 font-semibold">
                  +91
                </div>
                <input
                  value={otpPhone}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setOtpPhone(digits);
                    setOtpSent(false);
                  }}
                  inputMode="numeric"
                  placeholder="10-digit number"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sendOtpForInstant(otpPhone)}
                  disabled={otpSending}
                  className="w-full border border-blue-200 hover:border-blue-300 bg-white text-blue-700 font-extrabold py-2.5 rounded-xl disabled:opacity-60"
                >
                  {otpSending ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-gray-800">OTP</label>
                <input
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={verifyOtpAndProceedInstant}
                disabled={otpVerifying}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl active:scale-[0.98]"
              >
                {otpVerifying ? "Verifying…" : "Verify & Continue to Payment"}
              </button>

              <button
                type="button"
                onClick={cancelInstantOtp}
                className="w-full mt-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-800 font-semibold py-2.5 rounded-xl"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Instant Questions Modal (shown AFTER payment success) */}
      {instantQuestionsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={() => setInstantQuestionsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[580px] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-white/90 text-xs font-semibold tracking-wide">
                    Instant Report — ₹199 Paid ✅
                  </div>
                  <h2 className="text-white text-lg font-extrabold leading-tight mt-1">
                    {instantTopic}
                  </h2>
                  <div className="mt-2 text-white/90 text-xs leading-snug">
                    Tell us the 5 things you want to know. We’ll generate your
                    report accordingly.
                  </div>
                </div>

                <button
                  onClick={() => setInstantQuestionsOpen(false)}
                  className="shrink-0 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              className="px-4 pt-4 pb-4 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {instantError ? (
                <div className="mb-3 text-sm text-red-600 font-semibold">
                  {instantError}
                </div>
              ) : null}

              {instantQuestions.map((qv, i) => (
                <div key={i} className="mb-3">
                  <div className="text-xs font-bold text-gray-800 mb-1">
                    Question {i + 1}
                  </div>
                  <textarea
                    value={qv}
                    onChange={(e) => updateInstantQuestion(i, e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={generateInstantNow}
                disabled={instantBusy}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl active:scale-[0.98]"
              >
                {instantBusy ? "Generating…" : "Generate report"}
              </button>

              <div className="text-[11px] text-gray-500 text-center mt-2">
                After generation, the report will appear in{" "}
                <strong>My Profile</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Choose between Instant vs Pre-Book — improved scroll + “single glance” */}
      {prebookPromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={() => setPrebookPromptOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full sm:w-[580px] rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (fixed) */}
            {!instantOtpStep && (
              <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-white/90 text-xs font-semibold tracking-wide"></div>
                    <h2 className="text-white text-lg font-extrabold leading-tight mt-1">
                      Report not found for
                      <span className="block truncate mt-0.5">
                        “{prebookQuery}”
                      </span>
                    </h2>
                    <div className="mt-2 text-white/90 text-xs leading-snug"></div>
                  </div>

                  <button
                    onClick={() => setPrebookPromptOpen(false)}
                    className="shrink-0 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Trust strip */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/15 px-2 py-2 text-center">
                    <div className="text-white text-sm">🔒</div>
                    <div className="text-white/90 text-[10px] font-semibold">
                      Secure pay
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/15 px-2 py-2 text-center">
                    <div className="text-white text-sm">📩</div>
                    <div className="text-white/90 text-[10px] font-semibold">
                      OTP login
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/15 px-2 py-2 text-center">
                    <div className="text-white text-sm">👤</div>
                    <div className="text-white/90 text-[10px] font-semibold">
                      My Profile
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Body (scrollable) */}
            <div
              className="px-4 pt-4 pb-4 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {!instantOtpStep && (
                <p className="text-gray-700 text-sm leading-snug mb-3">
                  But our database can generate a report for{" "}
                  <strong>“{prebookQuery}”</strong>{" "}
                  — please choose an option below.
                </p>
              )}

              {/* ✅ Step switch: chooser ↔ OTP (inline) */}
              {instantOtpStep ? (
                <div className="px-1 pb-2 flex justify-center">
                  {/* ✅ UI-only sizing change: scale down OTP verification UI by 40% */}
                  <div
                    style={{
                      transform: "scale(0.6)",
                      transformOrigin: "top center",
                      width: "100%",
                      marginBottom: "-120px",
                    }}
                  >
                    {/* Slim loading bar */}
                    <div className="text-center text-3xl sm:text-4xl font-light text-gray-600 mt-1">
                      Loading Level
                    </div>

                    <div
                      className="mx-auto mt-4 mb-8"
                      style={{
                        width: "min(520px, 92%)",
                        background: "#ffffff",
                        borderRadius: "999px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                        padding: "12px 16px", // compact height
                      }}
                    >
                      <div
                        style={{
                          border: "2px solid #0b3bff",
                          borderRadius: "999px",
                          padding: "4px",
                        }}
                      >
                        <div
                          style={{
                            height: "14px",
                            borderRadius: "999px",
                            background: "#d5dcff",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <div className="rbr-otp-loadingbar" />
                        </div>
                        
                        <style>{`
                          @keyframes rbrIndeterminate {
                            0%   { transform: translateX(-60%); }
                            100% { transform: translateX(260%); }
                          }
                          .rbr-otp-loadingbar{
                            position:absolute;
                            top:0; left:0;
                            height:100%;
                            width:35%;
                            background:#0b3bff;
                            border-radius:999px;
                            animation:rbrIndeterminate 1.15s ease-in-out infinite;
                          }
                        `}</style>
                      </div>
                    </div>

                    {/* Verification content */}
                    <div className="text-center text-4xl sm:text-5xl font-light text-gray-700 mb-3">
                      Verification Code
                    </div>
                    <div className="text-center text-lg sm:text-xl text-gray-700 mb-6">
                      Please enter the verification code sent to your mobile
                    </div>

                    <div
                      className="flex items-center justify-center gap-3 mb-7"
                      onPaste={onOtpPaste}
                    >
                      {Array.from({ length: OTP_LEN }).map((_, i) => (
                        <React.Fragment key={i}>
                          <input
                            ref={(el) => (otpBoxesRef.current[i] = el)}
                            value={otpDigits[i] || ""}
                            onChange={(e) => onOtpChange(i, e)}
                            onKeyDown={(e) => onOtpKeyDown(i, e)}
                            inputMode="numeric"
                            maxLength={1}
                            className={
                              "w-12 h-12 sm:w-14 sm:h-14 text-2xl text-center border rounded-md focus:outline-none " +
                              (i ===
                              Math.min(
                                otpValue.replace(/\D/g, "").length,
                                OTP_LEN - 1
                              )
                                ? "border-black"
                                : "border-gray-300")
                            }
                            aria-label={`OTP digit ${i + 1}`}
                          />
                          {i < OTP_LEN - 1 && (
                            <span
                              className="text-gray-500 text-2xl"
                              aria-hidden
                            >
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {otpError && (
                      <div className="text-center text-sm text-red-600 -mt-3 mb-4">
                        {otpError}
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={verifyOtpAndProceedInstant}
                        disabled={otpVerifying}
                        className="w-[220px] sm:w-[260px] bg-indigo-600 hover:bg-indigo-700 text-white text-xl sm:text-2xl font-medium py-3 rounded-md shadow"
                      >
                        {otpVerifying ? "VERIFYING…" : "VERIFY"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* INSTANT */}
                  <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-3 flex flex-col">
                    <div className="absolute -top-2 right-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold px-2 py-1 shadow">
                        ⭐ Recommended
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-blue-700">
                      FASTEST
                    </div>
                    <div className="text-sm font-extrabold text-gray-900 leading-tight mt-1">
                      Instant 10-Page
                    </div>
                    <div className="text-xl font-extrabold text-blue-700 mt-1">
                      ₹199
                    </div>

                    <div className="text-[11px] text-gray-700 mt-2 leading-snug">
                      Quick evaluation: overview, trends, key players.
                    </div>

                    {/* FORCE confirmation for NEW users: show name/phone fields here too */}
                    {!prebookHasKnownUser && (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={prebookName}
                          onChange={(e) => setPrebookName(e.target.value)}
                          placeholder="Your name"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="tel"
                          value={prebookPhone}
                          onChange={(e) => setPrebookPhone(e.target.value)}
                          placeholder="WhatsApp number"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {instantChooserError && (
                      <p className="text-xs text-red-600 mt-2">
                        {instantChooserError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => triggerInstant(prebookQuery)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl active:scale-[0.98] shadow"
                    >
                      Generate
                    </button>

                    <div className="text-[10px] text-gray-500 text-center mt-1">
                      Secure checkout • View in <strong>My Profile</strong>
                    </div>

                    <div className="mt-2 text-[10px] text-gray-500 text-center">
                      Auto-generated (not a custom deep-dive)
                    </div>
                  </div>

                  {/* PREBOOK */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 flex flex-col">
                    <div className="text-[11px] font-semibold text-gray-700">
                      DETAILED
                    </div>
                    <div className="text-sm font-extrabold text-gray-900 leading-tight mt-1">
                      Full Report
                    </div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1">
                      ₹499
                    </div>

                    <div className="text-[11px] text-gray-700 mt-2 leading-snug">
                      Delivered within 72 hours. ₹499 adjusted in final price.
                    </div>

                    <details className="mt-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <summary className="cursor-pointer select-none text-xs font-semibold text-gray-800">
                        What happens after
                      </summary>
                      <div className="mt-2 text-[11px] text-gray-700 leading-relaxed">
                        <ul className="ml-4 list-disc space-y-1">
                          <li>OTP login to your account.</li>
                          <li>
                            Report unlocks in <strong>My Profile</strong>.
                          </li>
                          <li>
                            Delivery: <strong>within 72 hours</strong>.
                          </li>
                        </ul>
                      </div>
                    </details>

                    {/* Form is ONLY required for new users; kept as-is for pre-book */}
                    <form
                      onSubmit={handlePrebookSubmit}
                      className="space-y-2 mt-2"
                    >
                      {!prebookHasKnownUser && (
                        <>
                          <input
                            type="text"
                            value={prebookName}
                            onChange={(e) => setPrebookName(e.target.value)}
                            placeholder="Your name"
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="tel"
                            value={prebookPhone}
                            onChange={(e) => setPrebookPhone(e.target.value)}
                            placeholder="WhatsApp number"
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </>
                      )}

                      {prebookError && (
                        <p className="text-xs text-red-600">{prebookError}</p>
                      )}

                      <button
                        type="submit"
                        className="mt-1 w-full bg-gray-900 hover:bg-black text-white font-extrabold py-2.5 rounded-xl active:scale-[0.98]"
                      >
                        Pre-book
                      </button>

                      <div className="text-[10px] text-gray-500 text-center -mt-1">
                        Razorpay • OTP login • Access in{" "}
                        <strong>My Profile</strong>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Footer reassurance */}
              <div className="mt-4 text-[11px] text-gray-500 text-center px-2">
                By continuing, you agree to receive updates on WhatsApp / SMS for
                your report status.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Did you mean modal */}
      {suggestOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSuggestOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-blue-100 bg-[#EAF6FF] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-blue-900">
                Did you mean…
              </h3>
              <button
                onClick={() => setSuggestOpen(false)}
                className="h-8 w-8 rounded-full bg-white/70 hover:bg-white text-blue-700 flex items-center justify-center"
                aria-label="Close suggestions"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-blue-800/80 mb-3">
              You searched: <strong>{lastQuery}</strong>
            </p>

            <div className="space-y-2">
              {suggestItems.map((s) => (
                <button
                  key={s.slug || s.title}
                  type="button"
                  className="w-full text-left rounded-xl border border-blue-100 bg-white/80 hover:bg-white hover:border-blue-200 hover:shadow-md active:scale-[0.99] transition-all p-3 flex items-center gap-3"
                  onClick={() => {
                    setSuggestOpen(false);
                    goToReportBySlug(s.slug || resolveSlug(s.title || ""));
                  }}
                >
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span>📊</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {s.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={async () => {
                const query = (lastQuery || "").trim();
                setSuggestOpen(false);
                if (!query) return;
                await requestNewReport(query);
                await triggerPrebook(query);
              }}
              className="mt-3 w-full border border-blue-100 hover:border-blue-200 bg-[#DFF1FF] hover:bg-[#D6ECFF] text-blue-900 font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-all"
            >
              None of these
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsMobile;

// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing — logs searches; navigates only if a known report's preview exists.
// If no exact match, calls /suggest (POST) and shows a classic “Did you mean…?” popup (ice-blue).
// If still nothing, offers a Pre-Book flow using Razorpay + Prebooking API.

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

const EXAMPLES = [
  "Restaurant Business in india",
  "Paper industry in India",
  "FMCG market report",
  "IT industry analysis India",
  "EV charging stations India",
  "Competitor analysis pharma",
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

// ✅ Google Ads conversion for PREBOOK (₹499) — hardcoded
const PREBOOK_CONV_SEND_TO = "AW-824378442/X8klCKyRw9EbEMqIjIkD";

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
  const { state } = useContext(Store);
  const navigate = useNavigate();

  const [q, setQ] = useState("");

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

  // ⭐ Pre-book prompt modal state
  const [prebookPromptOpen, setPrebookPromptOpen] = useState(false);
  const [prebookQuery, setPrebookQuery] = useState("");
  const [prebookName, setPrebookName] = useState("");
  const [prebookPhone, setPrebookPhone] = useState("");
  const [prebookError, setPrebookError] = useState("");
  const [prebookHasKnownUser, setPrebookHasKnownUser] = useState(false);

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
        // ✅ stronger reassurance inside Razorpay popup
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
          setPrebookLoading(true);
          let confirmOk = false;

          fireGoogleAdsPrebookConversion({
            paymentId: response?.razorpay_payment_id,
            valueINR: 499,
          });

          try {
            const confirmResp = await fetch(PREBOOK_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userPhone,
                prebookId,
                razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            confirmOk = confirmResp.ok;
            if (!confirmResp.ok) {
              const txt = await confirmResp.text();
              console.error("prebook confirm failed:", confirmResp.status, txt);
            }
          } catch (e) {
            console.error("Error in prebook confirm handler:", e);
          } finally {
            setPrebookLoading(false);
          }

          navigate("/prebook-success", {
            replace: true,
            state: {
              prebookId,
              reportTitle: trimmed,
              userPhone,
              userName: userName || "RBR User",
              amount,
              currency,
              confirmOk,
              razorpayPaymentId: response.razorpay_payment_id,
            },
          });
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
          ⚠️ Pre-booking is temporarily unavailable. Please contact us on
          WhatsApp or try again in a few minutes.
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
          ⚠️ Something went wrong while starting the pre-booking. If any amount
          was deducted, our team will verify it from our side and contact you.
          Please try again later.
        </span>
      );
      setOpenModal(true);
    }
  };

  const triggerPrebook = async (query) => {
    const trimmed = query.trim();
    const savedPhone = state?.userInfo?.phone || state?.userInfo?.userId || "";
    const savedName = state?.userInfo?.name || "";

    setPrebookQuery(trimmed);
    setPrebookName(savedName);
    setPrebookPhone(savedPhone);
    setPrebookHasKnownUser(!!savedPhone);
    setPrebookError("");
    setPrebookPromptOpen(true);
  };

  // ✅ Instant report (₹199) — placeholder until backend is wired
  const triggerInstant = async (query) => {
    const trimmed = (query || "").trim();
    // (Later you’ll replace this with create-order + Razorpay flow for instant report)
    setPrebookPromptOpen(false);
    setModalTitle("Instant report coming soon");
    setModalMsgNode(
      <span>
        We’re enabling <strong>Instant 10-page reports</strong> for{" "}
        <strong>“{trimmed}”</strong>. <br />
        Please use <strong>Pre-book Full Report (₹499)</strong> for now.
      </span>
    );
    setOpenModal(true);
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
            📢 This report preview isn’t ready yet. Our team is adding it shortly.
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

      const reportSlug = resolveSlug(trimmed);
      if (!reportSlug) {
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

        // ✅ if lambda returns hint for generic searches, show our bold-friendly message
        if (hint) {
          setModalTitle("Search too generic");
          setModalMsgNode(renderGenericHint(trimmed));
          setOpenModal(true);
          return;
        }

        await requestNewReport(trimmed);
        await triggerPrebook(trimmed);
        return;
      }

      await goToReportBySlug(reportSlug);
    } catch (e) {
      console.error("Error during search flow:", e);
      setModalTitle("Error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while processing your request. Please try again
          later.
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
      }
    };
    if (openModal || suggestOpen || prebookPromptOpen || retryOpen) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, suggestOpen, prebookPromptOpen, retryOpen]);

  const handlePrebookSubmit = async (e) => {
    e.preventDefault();

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
    if (phoneDigits.length < 10) {
      setPrebookError("Please enter a valid phone number (at least 10 digits).");
      return;
    }
    setPrebookError("");
    setPrebookPromptOpen(false);

    await startPrebookFlow(prebookQuery, prebookName || "RBR User", phoneDigits);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-24 pb-10">
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
      </form>

      {/* Example chips */}
      <div className="w-full flex flex-wrap gap-2 mb-6">
        {EXAMPLES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setQ(t.slice(0, MAX_QUERY_CHARS));
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm"
          >
            {t}
          </button>
        ))}
      </div>

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

            {/* ✅ Reassurance content added here */}
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

      {/* ✅ Pre-book prompt modal (COMPACT popup + expandable details) */}
      {prebookPromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={() => setPrebookPromptOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[420px] bg-white rounded-2xl px-5 pt-1 pb-4 shadow-lg max-h-[65vh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
            onClick={(e) => e.stopPropagation()}
          >
           <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Not available yet
              </h2>
              <button
                onClick={() => setPrebookPromptOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>


            {/* ✅ Short + glanceable copy */}
            <p className="text-gray-700 text-sm leading-snug mb-3">
              We don’t have a ready report for <strong>“{prebookQuery}”</strong> yet — but we can generate one now:
            </p>
            
            {/* ✅ Option 1: Instant 10-page */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 mb-3">
              <div className="text-sm font-semibold text-gray-900">
                Instant 10-Page (₹199)
              </div>
              <div className="text-xs text-gray-700 mt-0.5">
                Auto-generated for “{prebookQuery}” using our existing data
              </div>
              <div className="text-[11px] text-gray-600 mt-1">
                Best for quick evaluation • Not a custom deep-dive
              </div>

              <button
                type="button"
                onClick={() => triggerInstant(prebookQuery)}
                className="mt-3 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
              >
                Generate Instant Report (₹199)
              </button>
            
              <div className="text-[11px] text-gray-500 text-center mt-1">
                OTP login • View in <strong>My Profile</strong>
              </div>
            </div>
            
            {/* ✅ Option 2: Pre-book full */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 mb-3">
              <div className="text-sm font-semibold text-gray-900">
                Full Report Pre-Book (₹499)
              </div>
              <div className="text-xs text-gray-700 mt-0.5">
                Detailed report in 72 hours
              </div>
            
              <div className="text-[11px] text-gray-500 mt-2">
                We’ll unlock it in <strong>My Profile</strong> when ready • ₹499 adjusted in final price
              </div>
            </div>


            {/* ✅ Optional details (doesn't make modal long unless opened) */}
            <details className="mb-2 rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-semibold text-gray-800">
                What happens after you pre-book
              </summary>
              <div className="mt-2 text-xs text-gray-700 leading-relaxed">
                <ul className="ml-4 list-disc space-y-1">
                  <li>OTP login to your account.</li>
                  <li>
                    Report is unlocked in <strong>My Profile</strong> when ready.
                  </li>
                  <li>
                    Delivery: <strong>within 72 hours</strong> (or clear ETA).
                  </li>
                  <li>
                    ₹499 is <strong>adjusted</strong> in final price.
                  </li>
                </ul>
                <div className="mt-2 text-[11px] text-gray-500">
                  Need help? Use the support option on the website after login.
                </div>
              </div>
            </details>

            <form onSubmit={handlePrebookSubmit} className="space-y-3">
              {!prebookHasKnownUser && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={prebookName}
                      onChange={(e) => setPrebookName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={prebookPhone}
                      onChange={(e) => setPrebookPhone(e.target.value)}
                      placeholder="e.g. 919XXXXXXXXX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {prebookError && <p className="text-xs text-red-600">{prebookError}</p>}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
              >
                Pay ₹499 &amp; pre-book
              </button>

              {/* ✅ Micro trust line under pay button */}
              <div className="text-[11px] text-gray-500 text-center -mt-1">
                Secure payment via Razorpay • OTP login • Access in <strong>My Profile</strong>
              </div>
            </form>
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
              onClick={() => setSuggestOpen(false)}
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

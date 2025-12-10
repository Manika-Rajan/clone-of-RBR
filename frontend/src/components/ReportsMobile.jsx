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
      reject(new Error("Razorpay SDK failed to load. Please refresh and try again."));
    document.body.appendChild(script);
  });

// Loader
const LoaderRing = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 animate-spin-slow">
    <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="8" />
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

const ReportsMobile = () => {
  const { state } = useContext(Store);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Suggestion modal (classic)
  const [suggestOpen, setSuggestOpen] = useState(false);
  // items: [{title, slug}]
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

  // ⭐ NEW: Pre-book prompt modal state
  const [prebookPromptOpen, setPrebookPromptOpen] = useState(false);
  const [prebookQuery, setPrebookQuery] = useState("");
  const [prebookName, setPrebookName] = useState("");
  const [prebookPhone, setPrebookPhone] = useState("");
  const [prebookError, setPrebookError] = useState("");

  // Autocomplete (static) chips under the input
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

  // Helper: resolve a slug from the free-text query (case-insensitive)
  const resolveSlug = (query) => {
    const ql = query.toLowerCase();
    for (const entry of ROUTER) {
      if (entry.keywords.some((kw) => ql.includes(kw))) {
        return entry.slug;
      }
    }
    return null;
  };

  // 🔎 ask /suggest for up to 3 items
  const fetchSuggestions = async (query) => {
    try {
      const resp = await fetch(SUGGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, limit: 3 }),
      });
      if (!resp.ok) return { items: [], exact_match: false };
      const data = await resp.json();
      const body = typeof data.body === "string" ? JSON.parse(data.body) : data;
      const items = (body.items || []).slice(0, 3);
      return { items, exact_match: !!body.exact_match };
    } catch (e) {
      console.error("suggest error:", e);
      return { items: [], exact_match: false };
    }
  };

  // When no matching report exists, queue a “create this report” request
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

  // ⭐ Pre-booking flow – now receives name + phone explicitly
  const startPrebookFlow = async (query, userName, userPhoneRaw) => {
    const trimmed = query.trim();
    const userPhone = (userPhoneRaw || "").trim();

    if (!trimmed || !userPhone) {
      setModalMsg(
        "⚠️ Missing details for pre-booking. Please enter a valid name and phone."
      );
      setOpenModal(true);
      return;
    }

    try {
      // 1) Hit backend to create prebooking + Razorpay order
      const resp = await fetch(`${PREBOOK_API_BASE}/prebook/create-order`, {
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
        setModalMsg(
          "⚠️ Could not start the pre-booking right now. Please try again in a few minutes."
        );
        setOpenModal(true);
        return;
      }

      const data = await resp.json();
      const {
        prebookId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
      } = data || {};

      if (!prebookId || !razorpayOrderId || !razorpayKeyId) {
        console.error("Invalid prebook response:", data);
        setModalMsg(
          "⚠️ Something went wrong while preparing the payment. Please try again."
        );
        setOpenModal(true);
        return;
      }

      // 2) Load Razorpay
      await loadRazorpay();
      if (!window.Razorpay) {
        setModalMsg(
          "⚠️ Payment SDK did not load properly. Please refresh the page and try again."
        );
        setOpenModal(true);
        return;
      }

      // 3) Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Pre-book: ${trimmed}`,
        order_id: razorpayOrderId,
        prefill: {
          name: userName || "RBR User",
          contact: userPhone,
        },
        notes: {
          type: "prebook",
          prebookId,
          reportTitle: trimmed,
          searchQuery: trimmed,
        },
        handler: async function (response) {
          try {
            const confirmResp = await fetch(
              `${PREBOOK_API_BASE}/prebook/confirm`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userPhone,
                  prebookId,
                  razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              }
            );

            if (!confirmResp.ok) {
              const txt = await confirmResp.text();
              console.error("prebook confirm failed:", confirmResp.status, txt);
            }

            setModalMsg(
              "✅ Thank you! Your report has been pre-booked. We will prepare it within 24 hours and add it to your profile."
            );
            setOpenModal(true);
          } catch (e) {
            console.error("Error in prebook confirm handler:", e);
            setModalMsg(
              "✅ Payment received. We will still prepare your report and add it to your profile, even if the confirmation took longer."
            );
            setOpenModal(true);
          }
        },
        theme: {
          color: "#0263c7",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("startPrebookFlow error:", e);
      setModalMsg(
        "⚠️ Something went wrong while starting the pre-booking. Please try again later."
      );
      setOpenModal(true);
    }
  };

  // ⭐ Decide: use existing user or show pre-book prompt
  const triggerPrebook = async (query) => {
    const trimmed = query.trim();
    const savedPhone =
      state?.userInfo?.phone || state?.userInfo?.userId || "";
    const savedName = state?.userInfo?.name || "";

    if (savedPhone) {
      // User is "known" – go straight to Razorpay
      await startPrebookFlow(trimmed, savedName || "RBR User", savedPhone);
      return;
    }

    // Ask for details in a small form
    setPrebookQuery(trimmed);
    setPrebookName(savedName);
    setPrebookPhone("");
    setPrebookError("");
    setPrebookPromptOpen(true);
  };

  // Given a slug, verify preview existence and navigate
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
        setModalMsg(
          "📢 This report preview isn’t ready yet. Our team is adding it shortly."
        );
        setOpenModal(true);
        return;
      }

      const presignData = await presignResp.json();
      const url = presignData?.presigned_url;
      if (!url) {
        setModalMsg(
          "📢 This report preview isn’t ready yet. Please check back soon."
        );
        setOpenModal(true);
        return;
      }

      // Small probe (be lenient; navigate even if probe fails network-wise)
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
          setModalMsg(
            "📢 This report preview isn’t ready yet. Please check back soon."
          );
          setOpenModal(true);
          return;
        }
      } catch {
        // ignore transient probe errors; still navigate
      }

      navigate("/report-display", { state: { reportSlug, reportId } });
    } catch (e) {
      console.error("goToReportBySlug error:", e);
      setModalMsg(
        "⚠️ Something went wrong while opening the report. Please try again."
      );
      setOpenModal(true);
    } finally {
      setSearchLoading(false);
    }
  };

  // log → (resolve) → navigate OR suggest → (if nothing) queue a new report & pre-book
  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLastQuery(trimmed);
    setSearchLoading(true);
    setModalMsg("");
    setSuggestOpen(false);
    try {
      window.gtag?.("event", "report_search", {
        event_category: "engagement",
        event_label: "mobile_reports_search",
        value: 1,
        search_term: trimmed,
      });

      // log to your search-log Lambda
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

      // 1) Try strict router first (no fallback)
      const reportSlug = resolveSlug(trimmed);
      if (!reportSlug) {
        // 1a) Ask suggest API (this should search rbrfinalfiles in S3)
        const { items } = await fetchSuggestions(trimmed);
        if (items && items.length > 0) {
          // Map API -> modal items with slug (so clicks can jump straight to report)
          const mapped = items.map((it) => ({
            title: it.title || it.slug,
            slug: it.slug, // crucial
          }));
          setSuggestItems(mapped.slice(0, 3));
          setSuggestOpen(true);
          return;
        }

        // 1b) Nothing to suggest → tell user & start pre-booking
        await requestNewReport(trimmed); // still queue for your internal pipeline
        await triggerPrebook(trimmed);
        return;
      }

      // 2) We have a slug → go open the report
      await goToReportBySlug(reportSlug);
    } catch (e) {
      console.error("Error during search flow:", e);
      setModalMsg(
        "⚠️ Something went wrong while processing your request. Please try again later."
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

  // close suggestions when clicking out
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

  // reposition on resize; close on scroll
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

  // ESC to close modals
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        if (suggestOpen) setSuggestOpen(false);
        if (openModal) setOpenModal(false);
        if (prebookPromptOpen) setPrebookPromptOpen(false);
      }
    };
    if (openModal || suggestOpen || prebookPromptOpen) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, suggestOpen, prebookPromptOpen]);

  // simple phone "validation": at least 10 digits
  const handlePrebookSubmit = async (e) => {
    e.preventDefault();
    const phoneDigits = (prebookPhone || "").replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setPrebookError("Please enter a valid phone number (at least 10 digits).");
      return;
    }
    setPrebookError("");
    setPrebookPromptOpen(false);

    await startPrebookFlow(
      prebookQuery,
      prebookName || "RBR User",
      phoneDigits
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-24 pb-10">
      {/* (Header removed – global Navbar provides brand + menu) */}

      {/* Hero */}
      <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-3 px-1">
        Get Instant Market &amp; Business Reports
      </h1>
      <p className="text-gray-600 text-center mb-6 text-sm sm:text-base px-2">
        Search 1000+ industry reports. Accurate. Reliable. Ready for your
        business.
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
            onChange={(e) => setQ(e.target.value)}
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
              setQ(t);
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
                  setQ(m);
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

      {/* Loader overlay */}
      {searchLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify:center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3">
              <LoaderRing />
            </div>
            <div className="text-gray-800 text-sm">Fetching your request…</div>
          </div>
        </div>
      )}

      {/* Generic info / success modal */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">
              📊 Rajan Business Reports
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {modalMsg ||
                "We’re adding this report to our catalog. Please check back soon!"}
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

      {/* ⭐ Pre-book prompt modal (name + phone) */}
      {prebookPromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setPrebookPromptOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">
              Pre-book this report
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              You searched for: <strong>{prebookQuery}</strong>
              <br />
              Enter your details to pre-book this report. We will prepare it
              within 24 hours and add it to your profile.
            </p>

            <form onSubmit={handlePrebookSubmit} className="space-y-3">
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

              {prebookError && (
                <p className="text-xs text-red-600">{prebookError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
              >
                Proceed to pay &amp; pre-book
              </button>

              <button
                type="button"
                onClick={() => setPrebookPromptOpen(false)}
                className="w-full mt-2 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl active:scale-[0.98]"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Did you mean modal (classic, max 3 suggestions) */}
      {suggestOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSuggestOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Centered modal */}
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
                className="h-8 w-8 rounded-full bg.white/70 hover:bg.white text-blue-700 flex items-center justify-center"
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
                    // Navigate directly using the slug
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
                  <div className="shrink-0 text-blue-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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

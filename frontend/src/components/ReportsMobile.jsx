// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing — logs searches; navigates only if a known report's preview exists.
// If no exact match, shows a classic “Did you mean…?” popup (ice-blue).

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

/**
 * Router of known reports — we navigate only if query clearly matches one of these.
 * Add/change keywords here as you add reports.
 */
const ROUTER = [
  { slug: "ev_charging",    keywords: ["ev charging", "charging station"],              title: "EV Charging Stations in India", icon: "🔌" },
  { slug: "fmcg",           keywords: ["fmcg"],                                         title: "FMCG Market Report India",      icon: "🛒" },
  { slug: "pharma",         keywords: ["pharma", "pharmaceutical"],                     title: "Pharma Competitor Analysis",    icon: "💊" },
  // removed the single-word "paper" so partials like "paper clip" don't auto-resolve
  { slug: "paper_industry", keywords: ["paper industry", "paper manufacturing"],        title: "Paper Industry in India",       icon: "📄" },
];

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
  const [suggestItems, setSuggestItems] = useState([]); // [{title, asQuery, icon, chips:[]}]
  const [lastQuery, setLastQuery] = useState("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({ left: 0, top: 0, width: 0 });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalBtnRef = useRef(null);

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

  // Helper: tokenization
  const tokenize = (text) =>
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter(Boolean);

  // Helper: build “Did you mean…?” suggestions by partial overlap
  const buildDidYouMean = (query) => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const intersects = (a, b) => a.some((x) => b.includes(x));
    const candidates = [];

    for (const entry of ROUTER) {
      const entryTokens = Array.from(
        new Set(entry.keywords.flatMap((kw) => tokenize(kw)))
      );
      if (intersects(tokens, entryTokens)) {
        const chips = Array.from(
          new Set(entryTokens.filter((t) => tokens.includes(t)))
        ).slice(0, 3);
        candidates.push({
          title: entry.title,
          asQuery: entry.title,
          icon: entry.icon || "📊",
          chips,
        });
      }
    }

    // If still room and "paper" present, add a couple of friendly extras
    const bag = new Set(tokens);
    if (candidates.length < 5 && bag.has("paper")) {
      const extras = [
        { title: "Paper cup manufacturing", asQuery: "paper cup manufacturing", icon: "🥤", chips: ["paper", "manufacturing"] },
        { title: "New paper industry in India", asQuery: "new paper industry in India", icon: "📰", chips: ["paper", "industry"] },
      ];
      const seen = new Set(candidates.map((c) => c.title));
      for (const x of extras) {
        if (!seen.has(x.title)) candidates.push(x);
      }
    }
    // ✅ Limit to 3 items
    return candidates.slice(0, 3);
  };

  // log → (resolve) → presign → tiny GET probe → navigate OR suggest / modal
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

      const payload = {
        search_query: trimmed,
        user: {
          name: state?.userInfo?.name || "Unknown",
          email: state?.userInfo?.email || "",
          phone: state?.userInfo?.phone || "",
          userId: state?.userInfo?.userId || state?.userInfo?.phone || "",
        },
      };
      const logResp = await fetch(
        "https://ypoucxtxgh.execute-api.ap-south-1.amazonaws.com/default/search-log",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!logResp.ok) {
        const t = await logResp.text();
        throw new Error(`Failed search-log ${logResp.status}, body: ${t}`);
      }
      await logResp.json();

      // 1) Decide slug strictly (no fallback)
      const reportSlug = resolveSlug(trimmed);
      if (!reportSlug) {
        const suggestions = buildDidYouMean(trimmed);
        if (suggestions.length > 0) {
          setSuggestItems(suggestions);
          setSuggestOpen(true);
          return; // wait for user tap
        }
        setModalMsg("📢 We don’t have a ready-made report for that yet. We’ve logged your request and will add it soon.");
        setOpenModal(true);
        return;
      }
      const reportId = `RBR1${Math.floor(Math.random() * 900 + 100)}`;

      // 2) Pre-check preview availability BEFORE navigating
      const previewKey = `${reportSlug}_preview.pdf`;
      const presignResp = await fetch(
        "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_key: previewKey }),
        }
      );

      if (!presignResp.ok) {
        setModalMsg("📢 This report preview isn’t ready yet. Our team is adding it shortly.");
        setOpenModal(true);
        return;
      }

      const presignData = await presignResp.json();
      const url = presignData?.presigned_url;

      if (!url) {
        setModalMsg("📢 This report preview isn’t ready yet. Please check back soon.");
        setOpenModal(true);
        return;
      }

      // 3) Tiny GET with Range (HEAD often 403 on presigned URLs)
      try {
        const probe = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1" } });
        const ct = (probe.headers.get("content-type") || "").toLowerCase();
        if (!probe.ok || !(probe.status === 200 || probe.status === 206) || !ct.includes("pdf")) {
          setModalMsg("📢 This report preview isn’t ready yet. Please check back soon.");
          setOpenModal(true);
          return;
        }
      } catch {
        navigate("/report-display", { state: { reportSlug, reportId } });
        return;
      }
      navigate("/report-display", { state: { reportSlug, reportId } });
    } catch (e) {
      console.error("Error during search flow:", e);
      setModalMsg("⚠️ Something went wrong while processing your request. Please try again later.");
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

  // ESC to close modal/sheet
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        if (suggestOpen) setSuggestOpen(false);
        if (openModal) setOpenModal(false);
      }
    };
    if (openModal || suggestOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, suggestOpen]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-10">
      {/* A tiny style block just to make <mark> pretty in suggestions */}
      <style>{`
        .nice-mark mark {
          background: linear-gradient(90deg, #e0f2ff, #f1f5ff);
          color: #0b63c7;
          padding: 0 6px;
          border-radius: 9999px;
          font-weight: 600;
        }
      `}</style>

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div className="text-xl font-extrabold text-gray-900 tracking-tight">RBR</div>
        <button className="text-gray-700 text-2xl p-2 leading-none" aria-label="Open menu" type="button">
          ☰
        </button>
      </header>

      {/* Hero */}
      <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-3 px-1">
        Get Instant Market &amp; Business Reports
      </h1>
      <p className="text-gray-600 text-center mb-6 text-sm sm:text-base px-2">
        Search 1000+ industry reports. Accurate. Reliable. Ready for your business.
      </p>

      {/* Search */}
      <form onSubmit={onSubmit} className="w-full mb-3">
        <label htmlFor="mobile-search" className="sr-only">Search reports</label>
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
      {showSuggestions && matches.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto rounded-b-xl"
            style={{ position: "fixed", left: dropdownRect.left, top: dropdownRect.top, width: dropdownRect.width }}
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
        )
      }

      {/* Loader overlay */}
      {searchLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3"><LoaderRing /></div>
            <div className="text-gray-800 text-sm">Fetching your request…</div>
          </div>
        </div>
      )}

      {/* Error / Coming soon modal */}
      {openModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">📊 This data is coming soon</div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {modalMsg || "We’re adding this report to our catalog. Please check back soon!"}
            </p>
            <button ref={modalBtnRef} onClick={closeModal} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]">
              Okay
            </button>
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
              <h3 className="text-base font-semibold text-blue-900">Did you mean…</h3>
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
              {suggestItems.slice(0, 3).map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="w-full text-left rounded-xl border border-blue-100 bg-white/80 hover:bg-white hover:border-blue-200 hover:shadow-md active:scale-[0.99] transition-all p-3 flex items-center gap-3"
                  onClick={() => {
                    setSuggestOpen(false);
                    setQ(s.asQuery);
                    handleSearch(s.asQuery);
                  }}
                >
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span>{s.icon || "📊"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {s.title}
                    </div>
                    {s.chips?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {s.chips.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-blue-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

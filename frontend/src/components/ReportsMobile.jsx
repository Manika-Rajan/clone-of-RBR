// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing page — logs searches; navigates only if a known report's preview exists.
// If no exact match, shows a "Did you mean...?" suggestion sheet based on partial overlap.

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
  { slug: "ev_charging",    keywords: ["ev charging", "charging station"], title: "EV Charging Stations in India" },
  { slug: "fmcg",           keywords: ["fmcg"],                           title: "FMCG Market Report India" },
  { slug: "pharma",         keywords: ["pharma", "pharmaceutical"],       title: "Pharma Competitor Analysis" },
  { slug: "paper_industry", keywords: ["paper industry", "paper manufacturing"], title: "Paper Industry in India" },
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

  // Suggestion sheet (for "Did you mean…?")
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState([]); // [{title, asQuery}]

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

  // Helper: build “Did you mean…?” suggestions by partial overlap
  // Strategy: split query into tokens; if a ROUTER entry has any keyword sharing any token, propose it.
  const buildDidYouMean = (query) => {
    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter(Boolean);

    if (tokens.length === 0) return [];

    const intersects = (a, b) => a.some((x) => b.includes(x));

    const candidates = [];
    for (const entry of ROUTER) {
      // build token bag for the entry (all keywords tokenized)
      const entryTokens = Array.from(
        new Set(
          entry.keywords.flatMap((kw) =>
            kw
              .toLowerCase()
              .split(/[^a-z0-9]+/i)
              .filter(Boolean)
          )
        )
      );
      if (intersects(tokens, entryTokens)) {
        candidates.push({
          title: entry.title,
          asQuery: entry.title, // what we will re-search with
        });
      }
    }

    // if we still have room, add a couple of sensible, generic variations for common stems
    const bag = new Set(tokens);
    if (candidates.length < 5) {
      if (bag.has("paper")) {
        candidates.push(
          { title: "Paper cup manufacturing", asQuery: "paper cup manufacturing" },
          { title: "New paper industry in India", asQuery: "new paper industry in India" }
        );
      }
      if (bag.has("fmcg")) {
        candidates.push({ title: "FMCG growth forecast India", asQuery: "FMCG growth forecast India" });
      }
    }

    // dedupe by title and limit to 5
    const seen = new Set();
    const unique = candidates.filter((c) => {
      if (seen.has(c.title)) return false;
      seen.add(c.title);
      return true;
    });

    return unique.slice(0, 5);
  };

  // core: log → (resolve) → presign → tiny GET probe → navigate OR suggest / modal
  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchLoading(true);
    setModalMsg("");
    setSuggestOpen(false);
    try {
      // analytics
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
        // Try “Did you mean…?”
        const suggestions = buildDidYouMean(trimmed);
        if (suggestions.length > 0) {
          setSuggestItems(suggestions);
          setSuggestOpen(true);
          return; // stop here; wait for user tap
        }
        // No good suggestions → show "coming soon"
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
        const probe = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
        });
        const ct = (probe.headers.get("content-type") || "").toLowerCase();

        if (!probe.ok || !(probe.status === 200 || probe.status === 206) || !ct.includes("pdf")) {
          setModalMsg("📢 This report preview isn’t ready yet. Please check back soon.");
          setOpenModal(true);
          return;
        }
      } catch (probeErr) {
        // Be lenient: try to navigate; viewer will show an error if truly missing
        navigate("/report-display", { state: { reportSlug, reportId } });
        return;
      }

      // ✅ preview exists → navigate (display will fetch the same key again)
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

  // ===== UI =====
  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-10">
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
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3"><LoaderRing /></div>
            <div className="text-gray-800 text-sm">Fetching your request…</div>
          </div>
        </div>
      )}

      {/* Error / Coming soon modal */}
      {openModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
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

      {/* "Did you mean...?" suggestion sheet */}
      {suggestOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSuggestOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">Did you mean…?</div>
            <div className="flex flex-col gap-2 mb-3">
              {suggestItems.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  onClick={() => {
                    setSuggestOpen(false);
                    setQ(s.asQuery);
                    // Immediately trigger a new search with the selected suggestion
                    handleSearch(s.asQuery);
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSuggestOpen(false)}
              className="w-full bg-gray-100 text-gray-800 font-semibold py-2.5 rounded-xl active:scale-[0.98]"
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

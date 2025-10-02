// clone-of-RBR/frontend/src/components/ReportsMobile.jsx
import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

const EXAMPLES = [
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

const ReportsMobile = () => {
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({
    left: 0,
    top: 0,
    width: 0,
  });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalBtnRef = useRef(null);

  // Filter suggestions
  const matches = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (v.length < 2) return [];
    return SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(v)
    ).slice(0, 6);
  }, [q]);

  // Compute absolute screen position of input (for portal dropdown)
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

  const onSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    if (window.gtag) {
      window.gtag("event", "report_search", {
        event_category: "engagement",
        event_label: "mobile_reports_search",
        value: 1,
        search_term: query,
      });
    }
    // Show “coming soon” modal
    setOpenModal(true);
    setShowSuggestions(false);
  };

  const closeModal = () => {
    setOpenModal(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Open suggestions on focus and position them
  const handleFocus = () => {
    computeDropdownPos();
    setShowSuggestions(true);
  };

  // Close suggestions on outside click (because we render to body)
  useEffect(() => {
    const handleClick = (e) => {
      const insideDropdown = dropdownRef.current?.contains(e.target);
      const insideInput = inputRef.current?.contains(e.target);
      if (!insideDropdown && !insideInput) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  // Recompute position on resize; close on scroll for tidiness
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

  // ESC to close modal
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") closeModal();
    };
    if (openModal) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal]);

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-24"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div className="text-xl font-extrabold text-gray-900 tracking-tight">
          RBR
        </div>
        <button
          className="text-gray-700 text-2xl p-2 leading-none"
          aria-label="Open menu"
          type="button"
        >
          ☰
        </button>
      </header>

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
            placeholder="e.g., FMCG market report, IT industry analysis…"
            inputMode="search"
            enterKeyHint="search"
            className="flex-grow px-3 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-3 rounded-r-xl font-semibold text-sm sm:text-base active:scale-[0.98]"
          >
            Search
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

      {/* Sample Reports */}
      <section className="w-full mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
          Sample Reports
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className="border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col items-center"
            >
              {/* responsive aspect-ratio thumbnail */}
              <div className="w-full h-0 pb-[140%] bg-gray-200 rounded-md mb-2" />
              <button
                type="button"
                className="text-blue-600 text-sm sm:text-base font-medium"
              >
                View Summary
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="w-full mb-8 text-center px-2">
        <p className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
          Trusted by 500+ businesses in India
        </p>
        <div className="flex justify-center gap-4">
          <div className="h-6 w-16 bg-gray-300 rounded" />
          <div className="h-6 w-16 bg-gray-300 rounded" />
          <div className="h-6 w-16 bg-gray-300 rounded" />
        </div>
      </section>

      {/* Sticky bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex justify-around text-gray-700 text-sm py-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <button type="button" className="px-2 font-medium">
          Search
        </button>
        <button type="button" className="px-2 font-medium">
          Reports
        </button>
        <button type="button" className="px-2 font-medium">
          Contact
        </button>
      </nav>

      {/* === Suggestions rendered via PORTAL (never affects layout) === */}
      {showSuggestions && matches.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] border border-gray-200 rounded-b-xl bg-white shadow-lg max-h-48 overflow-auto"
            style={{
              position: "absolute",
              left: dropdownRect.left,
              top: dropdownRect.top,
              width: dropdownRect.width,
            }}
          >
            {matches.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
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

      {/* Modal: Coming soon */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Sheet / Dialog */}
          <div
            className="relative z-10 w-full sm:w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">
              📊 This Data is coming soon
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              ℹ️ We’re sorry, the specific data you requested isn’t available
              right now. Our research team has logged your query, these insights
              will be added within the next 72 hours. Please revisit soon—we’ll
              make sure it’s worth your while.
            </p>
            <button
              ref={modalBtnRef}
              onClick={closeModal}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Okay, I’ll check back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsMobile;

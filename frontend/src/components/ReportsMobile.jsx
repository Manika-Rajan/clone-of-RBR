// clone-of-RBR/frontend/src/components/ReportsMobile.jsx
import React, { useState } from "react";

const ReportsMobile = () => {
  const [q, setQ] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: wire this to your actual search navigation / handler
    // e.g., navigate(`/report-display?q=${encodeURIComponent(q)}`)
    if (window.gtag) {
      window.gtag("event", "report_search", {
        event_category: "engagement",
        event_label: "mobile_reports_search",
        value: 1,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-6 pb-20">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div className="text-xl font-extrabold text-gray-900 tracking-tight">RBR</div>
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
        Search 1000+ industry reports. Accurate. Reliable. Ready for your business.
      </p>

      {/* Search */}
      <form onSubmit={onSubmit} className="w-full flex mb-8">
        <label htmlFor="mobile-search" className="sr-only">
          Search reports
        </label>
        <input
          id="mobile-search"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g., FMCG market report, IT industry analysis…"
          className="flex-grow px-3 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-3 rounded-r-xl font-semibold text-sm sm:text-base active:scale-[0.98]"
        >
          Search
        </button>
      </form>

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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex justify-around text-gray-700 text-sm py-3">
        <button type="button" className="px-2 font-medium">Search</button>
        <button type="button" className="px-2 font-medium">Reports</button>
        <button type="button" className="px-2 font-medium">Contact</button>
      </nav>
    </div>
  );
};

export default ReportsMobile;

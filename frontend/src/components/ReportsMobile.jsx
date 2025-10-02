import React from "react";

const MobileLanding = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div className="text-xl font-bold text-gray-800">RBR</div>
        <button className="text-gray-700">☰</button>
      </header>

      {/* Headline */}
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Get Instant Market & Business Reports
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Search 1000+ industry reports. Accurate. Reliable. Ready for your
        business.
      </p>

      {/* Search Bar */}
      <div className="w-full flex mb-8">
        <input
          type="text"
          placeholder="e.g., FMCG market report, IT industry analysis…"
          className="flex-grow px-3 py-3 border rounded-l-xl focus:outline-none text-sm"
        />
        <button className="bg-blue-600 text-white px-4 py-3 rounded-r-xl font-semibold">
          Search
        </button>
      </div>

      {/* Sample Reports */}
      <div className="w-full mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Sample Reports</h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-xl p-3 shadow-sm flex flex-col items-center"
            >
              <div className="w-20 h-28 bg-gray-200 mb-2"></div>
              <button className="text-blue-600 text-sm font-medium">View Summary</button>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <div className="w-full mb-8 text-center">
        <p className="font-semibold text-gray-700 mb-2">
          Trusted by 500+ businesses in India
        </p>
        <div className="flex justify-center gap-4">
          <div className="w-12 h-6 bg-gray-300 rounded"></div>
          <div className="w-12 h-6 bg-gray-300 rounded"></div>
          <div className="w-12 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full flex justify-around text-gray-600 text-sm border-t pt-4">
        <button>Search</button>
        <button>Reports</button>
        <button>Contact</button>
      </footer>
    </div>
  );
};

export default MobileLanding;

// RBR/frontend/src/components/ReportsDisplayMobile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";

/**
 * Mobile-first Reports Display
 * - Sticky header with logo + compact title
 * - PDF viewer fills the remaining viewport
 * - Sticky bottom BUY NOW bar
 * - Same payment/login flow as your original component
 */
const ReportsDisplayMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // From router state
  const fileKey = location.state?.fileKey || "";
  const reportId = location.state?.reportId || "";

  // Store (same as your existing component)
  const { state, dispatch: cxtDispatch } = useStore();
  const { isLogin = false, status = false, email = "" } = state || {};

  // UI state
  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  // In case you want to hide the bottom bar when near top header (optional)
  const headerRef = useRef(null);

  // Fetch presigned URL for the given fileKey
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!fileKey) {
        setIsLoading(false);
        setError("No fileKey provided. Please try generating the report again.");
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
            body: JSON.stringify({ file_key: fileKey }),
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
  }, [fileKey]);

  // Handle BUY NOW
  const handlePayment = () => {
    // Keep parity with your existing flow
    cxtDispatch({
      type: "SET_FILE_REPORT",
      payload: { fileKey, reportId },
    });
    setOpenModel(true);
  };

  // Close success modal and update status in store (parity with your code)
  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: "SET_REPORT_STATUS" });
  };

  // Basic meta (could be dynamic later)
  const title = "Paper Industry In India";
  const subtitle =
    "Candy production is a seasonal business, with most players doubling staff during the winter months.";

  return (
    <>
      {/* Page wrapper: header (fixed) + content (scroll) + bottom buy bar (sticky) */}
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
            <button
              onClick={handlePayment}
              className="ml-auto bg-blue-600 text-white text-sm px-3 py-2 rounded-lg active:scale-[0.98]"
            >
              BUY NOW
            </button>
          </div>
        </header>

        {/* Content: PDF viewer or states */}
        <main className="flex-1 overflow-auto">
          {/* Loader */}
          {isLoading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <svg
                  className="mx-auto animate-spin"
                  viewBox="0 0 100 100"
                  width="56"
                  height="56"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#0263c7"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset="70"
                  />
                </svg>
                <p className="mt-3 text-sm text-gray-800">
                  Fetching your report…
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !error && pdfUrl && (
            <div className="h-[calc(100vh-130px)] sm:h-[calc(100vh-120px)]">
              {/* The Worker must wrap the Viewer */}
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                {/* Using core Viewer (lighter than defaultLayout on mobile) */}
                <Viewer fileUrl={pdfUrl} />
              </Worker>
            </div>
          )}
        </main>

        {/* Sticky Bottom BUY bar */}
        <div className="sticky bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 leading-none">Report ID</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {reportId || "—"}
              </p>
            </div>
            <button
              onClick={handlePayment}
              className="ml-auto bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl active:scale-[0.98]"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>

      {/* Login / Payment Modal (parity with your original) */}
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(false)}
        style={{ maxWidth: "650px", width: "100%", marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          {/* Your Login component should route to /payment after success */}
          {/* Keep the same props you already used */}
          {/* eslint-disable-next-line react/jsx-no-undef */}
          <Login onClose={() => setOpenModel(false)} returnTo="/payment" />
          {status && (
            <div style={{ textAlign: "center" }}>
              <p className="success-head">The Report has been successfully sent to</p>
              <p className="success-email">{email}</p>
              <button className="btn btn-primary" onClick={changeStatus}>
                Ok
              </button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default ReportsDisplayMobile;

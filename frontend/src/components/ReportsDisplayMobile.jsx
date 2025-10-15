// RBR/frontend/src/components/ReportsDisplayMobile.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";
import Login from "./Login";

// Optional pricing UI (can keep or remove)
const MRP = 2999;
const PROMO_PCT = 25;
const FINAL = Math.round(MRP * (1 - PROMO_PCT / 100));

const ReportsDisplayMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // From router state
  const reportSlugFromState = location.state?.reportSlug || ""; // 👈 new
  const fileKeyLegacy = location.state?.fileKey || "";          // legacy fallback
  const reportId = location.state?.reportId || "";

  const { state, dispatch: cxtDispatch } = useStore();
  const { status = false, email = "", userInfo = {} } = state || {};
  const isLoggedIn = !!userInfo?.isLogin;

  // Purchases list: array of slugs, e.g., ["paper_industry", "fmcg"]
  const purchases = userInfo?.purchases || [];

  // Try to derive slug from legacy fileKey if needed
  const derivedSlugFromFileKey = useMemo(() => {
    if (!fileKeyLegacy) return "";
    // Accept ".../paper_industry_preview.pdf" or ".../paper_industry.pdf"
    const m = fileKeyLegacy.match(/([a-z0-9_]+)(?:_preview)?\.pdf$/i);
    return m ? m[1] : "";
  }, [fileKeyLegacy]);

  const reportSlug = reportSlugFromState || derivedSlugFromFileKey || "paper_industry";

  // Decide whether purchased
  const isPurchased = purchases.includes(reportSlug);

  // Compute the object key to presign
  const desiredKey = `${reportSlug}${isPurchased ? "" : "_preview"}.pdf`;

  // UI state
  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  const headerRef = useRef(null);

  // Fetch presigned URL for desiredKey
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

  // BUY NOW flow (kept simple)
  const goToPayment = () => {
    window.gtag?.("event", "buy_now_click", {
      event_category: "engagement",
      event_label: "mobile_reports_display",
      value: 1,
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

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: "SET_REPORT_STATUS" });
  };

  const title = `${reportSlug.replace(/_/g, " ")} in India`;
  const subtitle = isPurchased
    ? "Thanks for your purchase! You can access the full report below."
    : "Preview the report. Buy to unlock the complete version.";

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
                BUY NOW
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
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

          {!isLoading && !error && pdfUrl && (
            <div className="h-[calc(100vh-150px)] sm:h-[calc(100vh-140px)]">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer fileUrl={pdfUrl} />
              </Worker>
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
                  BUY NOW
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
    </>
  );
};

export default ReportsDisplayMobile;

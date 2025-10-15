// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing — logs searches; navigates only if a known report's preview exists.
// If no exact match, asks your /suggest Lambda (DynamoDB-backed) and shows a classic
// “Did you mean…?” popup (ice-blue, max 3 items).

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

// 🔗 Suggest API
const SUGGEST_API = "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/suggest";

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
  const [suggestItems, setSuggestItems] = useState([]); // [{title, asQuery, icon, chips:[], slug}]
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

  // 🔎 Ask your suggest Lambda (DynamoDB-backed) using GET to avoid CORS preflight
  async function fetchSuggestions(query, limit = 3) {
    try {
      const url = new URL(SUGGEST_API);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(limit));

      const r = await fetch(url.toString(), { method: "GET" }); // no headers → simple request
      if (!r.ok) return { items: [], exact_match: false };

      // Some API Gateway setups return the Lambda "body" directly (already JSON),
      // others wrap as { body: "..." }. Handle both safely:
      const raw = await r.text();
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed.items === "undefined" && typeof parsed.body === "string") {
        // Wrapped response
        return JSON.parse(parsed.body);
      }
      return parsed || { items: [], exact_match: false };
    } catch {
      return { items: [], exact_match: false };
    }
  }

  // Small helper: presign preview and “probe” before navigating
  async function canPreview(slug) {
    const previewKey = `${slug}_preview.pdf`;
    try {
      const presignResp = await fetch(
        "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_key: previewKey }),
        }
      );
      if (!presignResp.ok) return false;
      const presignData = await presignResp.json();
      const url = presignData?.presigned_url;
      if (!url) return false;

      // Tiny GET with Range; HEAD can 403 on some S3 configs
      const probe = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1" } });
      const ct = (probe.headers.get("cont

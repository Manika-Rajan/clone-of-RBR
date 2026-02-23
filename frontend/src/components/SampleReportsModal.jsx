import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function SampleReportsModal({
  open,
  onClose,
  items = [],
  onPick, // (item) => void
  title = "Sample Reports",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[520px] rounded-3xl border border-white/10 bg-[#0b1220]/95 shadow-2xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/15 via-blue-400/10 to-fuchsia-400/15 blur-xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-white text-lg font-semibold">{title}</div>
            <div className="text-white/60 text-xs mt-1">
              Tap a report to open preview
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="relative p-4">
          <div className="max-h-[62vh] overflow-auto pr-1">
            <div className="grid gap-2">
              {items.map((it, idx) => (
                <button
                  key={it.id || it.slug || it.query || idx}
                  type="button"
                  onClick={() => onPick?.(it)}
                  className="group w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 px-4 py-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-medium">
                        {it.title || it.query}
                      </div>
                      {it.subtitle ? (
                        <div className="text-white/60 text-xs mt-1">
                          {it.subtitle}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-white/60 group-hover:text-white/80 mt-0.5">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!items?.length ? (
              <div className="text-white/60 text-sm py-10 text-center">
                No sample reports configured.
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-white/50 text-xs">
              Tip: samples should feel like real “search queries”
            </div>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

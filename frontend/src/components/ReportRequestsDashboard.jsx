// RBR/frontend/src/components/ReportRequestsDashboard.jsx
import React, { useEffect, useState } from "react";

// Change this if you later move to a custom domain for the API
const API_BASE = "https://sicgpldzo8.execute-api.ap-south-1.amazonaws.com";

const ReportRequestsDashboard = () => {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/report-requests?status=${encodeURIComponent(
          statusFilter
        )}`
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Error loading report requests:", e);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Report Requests
          </h1>
          <p className="text-sm text-gray-500">
            Viewing all requests with status: <strong>{statusFilter}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="DRAFT_UPLOADED">DRAFT_UPLOADED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {items.length === 0 && !loading && !error && (
        <div className="text-sm text-gray-500">
          No requests found for this status.
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Query</th>
                <th className="px-3 py-2 text-left">Requested By</th>
                <th className="px-3 py-2 text-left">Created At</th>
                <th className="px-3 py-2 text-left">Email / Phone</th>
                <th className="px-3 py-2 text-left">Assigned To</th>
                <th className="px-3 py-2 text-left">Priority</th>
              </tr>
            </thead>
            <tbody>
              {items.map((req) => (
                <tr key={req.request_id} className="border-t">
                  <td className="px-3 py-2 max-w-xs">
                    <div className="font-medium text-gray-900">
                      {req.search_query}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {req.request_id}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {req.requested_by_name || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      User ID: {req.user_id || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {req.created_at
                      ? new Date(req.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {req.user_email || "—"}
                    <br />
                    {req.user_phone || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {req.assigned_to_name
                      ? `${req.assigned_to_name} (${req.assigned_to || ""})`
                      : "Unassigned"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {req.priority || "MEDIUM"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportRequestsDashboard;

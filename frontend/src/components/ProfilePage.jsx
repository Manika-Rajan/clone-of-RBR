// RBR/frontend/src/components/ProfilePage.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../Store";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { state } = useStore() || {};

  // 🔧 Adjust these keys to match your Store.js structure
  const user = state?.user || {};
  const purchases = state?.purchases || []; // e.g. [{ id, title, date, amount, downloadUrl }]

  const isLoggedIn = !!user?.phone || !!user?.email;

  const totalSpent = useMemo(
    () =>
      purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [purchases]
  );

  return (
    <div className="profile-root">
      <div className="profile-container">
        {/* Header */}
        <header className="profile-header">
          <h1>My Account</h1>
          <p className="profile-subtitle">
            View your details, purchased reports and downloads.
          </p>
        </header>

        {!isLoggedIn ? (
          <div className="profile-card profile-empty">
            <h2>You are not logged in</h2>
            <p>Please log in with your phone number to view your reports.</p>
            <Link to="/profile" className="btn-primary">
              Go to Login / OTP
            </Link>
          </div>
        ) : (
          <>
            {/* Top: user info + quick stats */}
            <section className="profile-grid">
              <div className="profile-card">
                <h2>Profile details</h2>
                <div className="profile-field">
                  <span className="label">Name</span>
                  <span className="value">
                    {user.name || "Entrepreneur"}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="label">Phone</span>
                  <span className="value">
                    {user.phone || "Not available"}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="label">Email</span>
                  <span className="value">
                    {user.email || "Not available"}
                  </span>
                </div>

                <div className="profile-actions">
                  {/* You can wire these later */}
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      // e.g. open modal to edit email / name
                      alert("Edit profile coming soon.");
                    }}
                  >
                    Edit profile
                  </button>
                </div>
              </div>

              <div className="profile-card">
                <h2>Account summary</h2>
                <div className="summary-row">
                  <div className="summary-item">
                    <div className="summary-number">
                      {purchases.length}
                    </div>
                    <div className="summary-label">
                      Reports purchased
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-number">
                      ₹{totalSpent.toLocaleString("en-IN")}
                    </div>
                    <div className="summary-label">
                      Total spent
                    </div>
                  </div>
                </div>
                <p className="summary-note">
                  Need help with your purchases?{" "}
                  <a
                    href="https://wa.me/918123456789" // 🔧 replace with your official WhatsApp
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chat with support
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Purchased reports */}
            <section className="profile-card profile-reports">
              <div className="section-header">
                <h2>My reports</h2>
                {purchases.length > 0 && (
                  <span className="badge">
                    {purchases.length} active
                  </span>
                )}
              </div>

              {purchases.length === 0 ? (
                <div className="empty-state">
                  <p>You haven’t purchased any reports yet.</p>
                  <Link to="/reports" className="btn-primary">
                    Browse reports
                  </Link>
                </div>
              ) : (
                <div className="reports-list">
                  {purchases.map((p) => (
                    <div className="report-row" key={p.id || p.orderId}>
                      <div className="report-main">
                        <div className="report-title">
                          {p.title || "Business report"}
                        </div>
                        <div className="report-meta">
                          <span>
                            Purchased on{" "}
                            {p.date
                              ? new Date(p.date).toLocaleDateString(
                                  "en-IN"
                                )
                              : "N/A"}
                          </span>
                          <span>Order ID: {p.orderId || "--"}</span>
                        </div>
                      </div>

                      <div className="report-actions">
                        {p.downloadUrl ? (
                          <a
                            href={p.downloadUrl}
                            className="btn-secondary"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download PDF
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              alert(
                                "Download link will be available soon. Please contact support if you don't receive it."
                              )
                            }
                          >
                            Get link
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            // You can call your "resend WhatsApp" endpoint here
                            alert(
                              "We will soon let you resend the report to WhatsApp from here."
                            );
                          }}
                        >
                          Resend to WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

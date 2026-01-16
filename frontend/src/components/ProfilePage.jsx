import React, { useState, useEffect, useContext, useMemo } from 'react';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

// ✅ Same PDF viewer stack as ReportsDisplay.js
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

// ✅ Add the same default layout plugin used in ReportsDisplay.js
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const DEFAULT_PROFILE_ICON = '/default-avatar.png';



// Sample fallback row
const SAMPLE_FILE_KEY = 'samples/RBR_Welcome_Sample.pdf';
const SAMPLE_VERSION = '1.0';

// ---- Helpers ----
const parseDateSafe = (r) => {
  const d = r.purchased_on || r.granted_on || r.granted_at || r.created_at || null;
  if (!d) return 0;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? 0 : dt.getTime();
};

const beautifyFileName = (fileKey) => {
  if (!fileKey) return '';
  const name = fileKey.split('/').pop() || fileKey;
  const withoutExt = name.replace(/\.[^.]+$/, '');
  return withoutExt
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const getCurrentUserIdFromStorage = () => {
  try {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    return (
      storedUserInfo?.user_id ||
      storedUserInfo?.userId ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('userId') ||
      null
    );
  } catch {
    return null;
  }
};

const ProfilePage = () => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate(); // (kept as-is; harmless even if unused)

  const defaultLayoutPluginInstance = useMemo(() => defaultLayoutPlugin(), []);

  const [purchasedReports, setPurchasedReports] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Viewer state
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [loadingFileKey, setLoadingFileKey] = useState(null);

  // Profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [nameInput, setNameInput] = useState(userInfo?.name || '');
  const [emailInput, setEmailInput] = useState(userInfo?.email || '');
  const [photoUrl, setPhotoUrl] = useState(userInfo?.photo_url || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);

  // Search / sort state for purchased reports
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest' | 'name-asc' | 'name-desc'

  // ---- Load profile (with auto-refresh on window focus) ----
  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      let storedUserId =
        storedUserInfo?.user_id ||
        storedUserInfo?.userId ||
        localStorage.getItem('user_id') ||
        localStorage.getItem('userId');

      let authToken = localStorage.getItem('authToken') || '';

      if (!storedUserId) {
        console.warn('User ID missing.');
        if (!isActive) return;
        setLoading(false);
        setError('User ID not found. Please log in again.');
        return;
      }

      // normalize storage
      localStorage.setItem('user_id', storedUserId);
      if (storedUserInfo) {
        storedUserInfo.user_id = storedUserId;
        delete storedUserInfo.userId;
        localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));
      }

      if (!authToken && storedUserInfo?.token) {
        authToken = storedUserInfo.token;
        localStorage.setItem('authToken', authToken);
      }

      if (!userInfo?.user_id) {
        cxtDispatch({ type: 'SET_USER_ID', payload: storedUserId });
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/getUserProfile-RBRmain-APIgateway',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ user_id: storedUserId }),
          }
        );

        const data = await response.json();
        if (!isActive) return;

        if (response.ok) {
          const reportsArray = Array.isArray(data.reports) ? data.reports : [];
          setPurchasedReports(reportsArray);

          setNameInput(data.name || '');
          setEmailInput(data.email || '');
          const fetchedPhotoUrl = data.photo_url || null;
          setPhotoUrl(fetchedPhotoUrl);

          const current = userInfo || {};
          const next = {
            isLogin: true,
            user_id: storedUserId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            photo_url: fetchedPhotoUrl,
            token: authToken,
          };

          const changed =
            current.user_id !== next.user_id ||
            current.name !== next.name ||
            current.email !== next.email ||
            current.phone !== next.phone ||
            current.photo_url !== next.photo_url ||
            current.token !== next.token ||
            current.isLogin !== true;

          if (changed) {
            cxtDispatch({ type: 'USER_LOGIN', payload: next });
            localStorage.setItem('userInfo', JSON.stringify(next));
          }
        } else {
          throw new Error(
            data.error ||
              `Failed to fetch profile (Status: ${response.status}) - ${
                data.message || 'No additional details'
              }`
          );
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Error fetching profile:', err.message, err.stack);
        setError(`Failed to load profile data: ${err.message}. Check CORS configuration on the server.`);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadProfile();

    const handleFocus = () => {
      loadProfile();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [cxtDispatch, userInfo?.user_id]);

  // ---- Load recently viewed reports from localStorage ----
  useEffect(() => {
    try {
      const uid = getCurrentUserIdFromStorage();
      if (!uid) return;
      const key = `rbr_recent_reports_${uid}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentlyViewed(parsed);
      }
    } catch (e) {
      console.warn('Failed to load recently viewed reports from localStorage:', e);
    }
  }, []);

  // ---- Track recently viewed reports ----
  const trackRecentlyViewed = (report) => {
    try {
      const uid = getCurrentUserIdFromStorage();
      if (!uid) return;
      const key = `rbr_recent_reports_${uid}`;

      setRecentlyViewed((prev) => {
        const cleanPrev = Array.isArray(prev) ? prev : [];
        const base = {
          report_id: report.report_id || report.reportId || '',
          file_key: report.file_key || '',
          title:
            report.report_title ||
            report.title ||
            report._displayTitle ||
            beautifyFileName(report.file_key) ||
            'Report',
        };

        const filtered = cleanPrev.filter(
          (r) => !(r.report_id === base.report_id && r.file_key === base.file_key)
        );

        const next = [{ ...base, viewed_at: new Date().toISOString() }, ...filtered].slice(0, 5);

        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.warn('Failed to persist recently viewed reports:', e);
    }
  };

  // ---- Presigned URL + view handling ----
  const fetchPresignedUrl = async (report) => {
    try {
      const fileKey = report.file_key || SAMPLE_FILE_KEY;
      if (!fileKey) {
        alert('File key is missing for this report.');
        return;
      }

      setSelectedUrl(null);
      setLoadingFileKey(fileKey);

      const resp = await fetch(
        'https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_key: fileKey }),
        }
      );

      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`Failed to get presigned URL. HTTP ${resp.status}. Body: ${t}`);
      }

      const data = await resp.json().catch(() => ({}));
      console.log('Presigned URL payload:', data);

      if (!data?.presigned_url) {
        throw new Error('No presigned_url returned by Lambda');
      }

      trackRecentlyViewed(report);
      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      alert(
        `Failed to open the report. ${error?.message || ''}\n\nTip: Check Network tab -> the GET to the signed URL must be 200 with content-type application/pdf, and the URL must not be expired.`
      );
    } finally {
      setLoadingFileKey(null);
    }
  };

  // ---- Derived purchased reports: decorate + filter + sort ----
  const hasPurchases = purchasedReports && purchasedReports.length > 0;

  const filteredReports = useMemo(() => {
    if (!hasPurchases) return [];

    let arr = purchasedReports.map((r) => {
      const displayTitle =
        r.report_title || r.title || beautifyFileName(r.file_key) || r.report_id || 'Report';
      return { ...r, _displayTitle: displayTitle };
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter((r) => {
        const title = (r._displayTitle || '').toLowerCase();
        const rid = (r.report_id || r.reportId || '').toLowerCase();
        const fkey = (r.file_key || '').toLowerCase();
        return title.includes(q) || rid.includes(q) || fkey.includes(q);
      });
    }

    const sorted = [...arr].sort((a, b) => {
      const dateA = parseDateSafe(a);
      const dateB = parseDateSafe(b);

      switch (sortOption) {
        case 'oldest':
          return dateA - dateB;
        case 'name-asc':
          return (a._displayTitle || '').localeCompare(b._displayTitle || '');
        case 'name-desc':
          return (b._displayTitle || '').localeCompare(a._displayTitle || '');
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return sorted;
  }, [hasPurchases, purchasedReports, searchTerm, sortOption]);

  // ---- Sample row for brand-new accounts (no purchases) ----
  const sampleReports = useMemo(
    () => [
      {
        file_key: SAMPLE_FILE_KEY,
        report_version: SAMPLE_VERSION,
        _displayTitle: 'RBR Sample Report (Free Preview)',
        purchased_on: '—',
        _isSample: true,
      },
    ],
    []
  );

  // Photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const uid =
      storedUserInfo?.user_id ||
      storedUserInfo?.userId ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken') || '';

    if (!uid) {
      alert('Failed to upload photo: userId is undefined or missing');
      return;
    }

    setPhotoUploading(true);
    try {
      const response = await fetch(
        'https://70j2ry7zol.execute-api.ap-south-1.amazonaws.com/default/generate-presigned-url-for-photo-RBRmain',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userId: uid }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`);
      }
      const { presignedPutUrl, presignedGetUrl } = await response.json();

      const uploadResponse = await fetch(presignedPutUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        throw new Error(`Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`);
      }

      setPhotoUrl(presignedGetUrl);
      setNewPhoto(null);
      alert('Photo uploaded successfully!');
      const updatedUserInfo = { ...storedUserInfo, user_id: uid, photo_url: presignedGetUrl };
      cxtDispatch({ type: 'USER_LOGIN', payload: updatedUserInfo });
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    } catch (error) {
      console.error('Error uploading photo:', error.message, error.stack);
      alert(`Unable to upload photo: ${error.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const user_id = storedUserInfo?.user_id || localStorage.getItem('user_id');
    const authToken = localStorage.getItem('authToken') || '';
    if (!user_id) {
      alert('User ID is missing.');
      return;
    }

    setIsSaving(true);
    try {
      const profileData = {
        user_id,
        name: nameInput,
        email: emailInput,
        phone: storedUserInfo?.phone || '',
        photo_url: null,
      };
      const response = await fetch(
        'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(profileData),
        }
      );
      if (!response.ok) throw new Error('Failed to remove photo');
      await response.json();
      setPhotoUrl(null);
      const updatedUserInfo = { ...userInfo, user_id, photo_url: null };
      cxtDispatch({ type: 'USER_LOGIN', payload: updatedUserInfo });
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      alert('Profile photo removed successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove profile photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const user_id = storedUserInfo?.user_id || localStorage.getItem('user_id');
    if (!user_id) {
      alert('User ID is missing.');
      return;
    }

    const profileData = {
      user_id,
      name: nameInput,
      email: emailInput,
      phone: storedUserInfo?.phone || '',
      photo_url: photoUrl || '',
    };

    setIsSaving(true);
    try {
      const response = await fetch(
        'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
          body: JSON.stringify(profileData),
        }
      );
      if (!response.ok) throw new Error('Failed to save profile');
      await response.json();
      alert('Profile saved successfully');
      const updatedUserInfo = {
        ...storedUserInfo,
        user_id,
        name: nameInput,
        email: emailInput,
        phone: profileData.phone,
        photo_url: photoUrl,
      };
      cxtDispatch({ type: 'USER_LOGIN', payload: updatedUserInfo });
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const renderPurchasedOn = (r) => {
    const d = r.purchased_on || r.granted_on || r.granted_at || r.created_at || null;
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
  };

  const selectedTitle = (() => {
    return 'Report Viewer';
  })();

  return (
    <div className="profile-page">
      {/* ---- modal sizing helpers (scoped to this page) ---- */}
      <style>{`
        .rbr-viewer-content { height: 92vh; }
        .rbr-viewer-body { height: calc(92vh - 56px); padding: 0; overflow: hidden; }
        .rbr-viewer-scroll { height: 100%; width: 100%; overflow: hidden; }
        .rbr-report-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rbr-report-thumb {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #f3f6ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .rbr-recent-list {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }
        .rbr-recent-item-button {
          background: none;
          border: none;
          padding: 0;
          color: #0d6efd;
          text-decoration: underline;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .rbr-pdf-wrapper {
          height: 100%;
          width: 100%;
        }
      `}</style>

      <div className="profile-container">
        <div className="profile-card">
          <div className="user-info">
            <div className="photo-section">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="profile-photo"
                  onError={(e) => {
                    console.error('Photo URL failed to load:', e);
                    e.target.src = DEFAULT_PROFILE_ICON;
                  }}
                />
              ) : (
                <img
                  src={DEFAULT_PROFILE_ICON}
                  alt="Default Profile"
                  className="profile-photo"
                  onError={(e) => {
                    console.error('Default image failed to load:', e);
                    e.target.src = 'https://via.placeholder.com/120?text=Default+Avatar';
                  }}
                />
              )}
            </div>
            <div className="info-section">
              <h2 className="user-name">{nameInput || 'Not Available'}</h2>
              <p className="user-detail">
                <strong>Phone:</strong> {userInfo?.phone || 'Not Available'}
              </p>
              <p className="user-detail">
                <strong>Email:</strong> {emailInput || 'Not Available'}
              </p>
              <button className="edit-profile-button" onClick={() => setShowEditModal(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Purchased Reports */}
        <div className="reports-section">
          <h3 className="section-title">Purchased Reports</h3>

          {hasPurchases ? (
            <>
              {purchasedReports.length > 8 && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="flex-grow-1 me-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search your reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="form-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="name-asc">Name A → Z</option>
                      <option value="name-desc">Name Z → A</option>
                    </select>
                  </div>
                </div>
              )}

              {filteredReports.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped align-middle rbr-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 260, textAlign: 'left' }}>Report</th>
                        <th style={{ textAlign: 'center' }}>Version</th>
                        <th style={{ textAlign: 'center' }}>Purchased on</th>
                        <th style={{ width: 120, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((r) => {
                        const isRowLoading = loadingFileKey === r.file_key;
                        const displayTitle =
                          r._displayTitle ||
                          r.report_title ||
                          r.title ||
                          beautifyFileName(r.file_key) ||
                          'Report';

                        return (
                          <tr key={r.file_key || displayTitle}>
                            <td>
                              <div className="rbr-report-cell">
                                <div className="rbr-report-thumb">📊</div>
                                <div>
                                  <div>{displayTitle}</div>
                                  {r.report_id && (
                                    <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                      ID: {r.report_id}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {r.report_version || 'N/A'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {renderPurchasedOn(r)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => fetchPresignedUrl(r)}
                                disabled={isRowLoading}
                              >
                                {isRowLoading ? 'Opening…' : 'View'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted" style={{ marginTop: 8 }}>
                  No reports match your search.
                </p>
              )}
            </>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle rbr-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 260, textAlign: 'left' }}>Report</th>
                    <th style={{ textAlign: 'center' }}>Version</th>
                    <th style={{ textAlign: 'center' }}>Purchased on</th>
                    <th style={{ width: 120, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleReports.map((r) => {
                    const isRowLoading = loadingFileKey === r.file_key;
                    return (
                      <tr key={r.file_key}>
                        <td>
                          <div className="rbr-report-cell">
                            <div className="rbr-report-thumb">📄</div>
                            <div>{r._displayTitle}</div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {r.report_version || 'N/A'}
                        </td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => fetchPresignedUrl(r)}
                            disabled={isRowLoading}
                          >
                            {isRowLoading ? 'Opening…' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-muted" style={{ marginTop: 8 }}>
                This is a sample preview added for new accounts. Your purchased reports will appear here automatically after you buy them.
              </p>
            </div>
          )}
        </div>

        {/* Recently viewed reports */}
        <div className="reports-section" style={{ marginTop: '24px' }}>
          <h4 className="section-title">Recently viewed reports</h4>
          {recentlyViewed && recentlyViewed.length > 0 ? (
            <ul className="rbr-recent-list">
              {recentlyViewed.map((r) => (
                <li key={`${r.report_id}-${r.file_key}`} style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    className="rbr-recent-item-button"
                    onClick={() =>
                      fetchPresignedUrl({
                        report_id: r.report_id,
                        file_key: r.file_key,
                        title: r.title,
                      })
                    }
                  >
                    {r.title || beautifyFileName(r.file_key) || 'Report'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">
              You haven’t opened any reports yet. When you view a report, it will appear here for quick access.
            </p>
          )}
        </div>

        {/* ✅ PDF viewer modal */}
        <Modal
          isOpen={!!selectedUrl || !!loadingFileKey}
          toggle={() => {
            setSelectedUrl(null);
            setLoadingFileKey(null);
          }}
          className="full-page-modal"
          size="xl"
          contentClassName="rbr-viewer-content"
        >
          <ModalHeader
            toggle={() => {
              setSelectedUrl(null);
              setLoadingFileKey(null);
            }}
          >
            {selectedTitle}
          </ModalHeader>

          <ModalBody className="rbr-viewer-body">
            <div className="rbr-viewer-scroll" onContextMenu={(e) => e.preventDefault()}>
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                {!selectedUrl ? (
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: '100%', width: '100%' }}
                  >
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="rbr-pdf-wrapper">
                    <Viewer fileUrl={selectedUrl} plugins={[defaultLayoutPluginInstance]} />
                  </div>
                )}
              </Worker>
            </div>
          </ModalBody>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal isOpen={showEditModal} toggle={() => setShowEditModal(false)} className="full-page-modal">
          <ModalHeader toggle={() => setShowEditModal(false)}>Edit Profile</ModalHeader>
          <ModalBody>
            <div className="edit-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="form-control"
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="form-control"
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label>Photo:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setNewPhoto(e.target.files[0]);
                    handlePhotoUpload(e);
                  }}
                  className="form-control"
                  disabled={photoUploading}
                />
                {photoUploading && <p>Uploading...</p>}
                {!photoUrl && !photoUploading && (
                  <p>No photo uploaded. Upload to set a profile picture.</p>
                )}
                {photoUrl && (
                  <button className="btn btn-danger" onClick={handleRemovePhoto} disabled={isSaving}>
                    {isSaving ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
              </div>

              <button className="btn btn-primary" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
                style={{ marginLeft: '8px' }}
              >
                Cancel
              </button>
            </div>
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;

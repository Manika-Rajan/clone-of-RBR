import React, { useState, useEffect, useContext, useMemo } from 'react';
import './ProfilePage.css';            // shared styles (viewer, etc.)
import './ProfilePageMobile.css';      // mobile-specific styles
import { Store } from '../Store';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

const DEFAULT_PROFILE_ICON = '/default-avatar.png';
const SAMPLE_FILE_KEY = 'samples/RBR_Welcome_Sample.pdf';
const SAMPLE_VERSION = '1.0';

// ---- Helpers ----
const parseDateSafe = (r) => {
  const d =
    r.purchased_on ||
    r.granted_on ||
    r.granted_at ||
    r.created_at ||
    null;
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

const ProfilePageMobile = () => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;

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

  // ---- Load profile ----
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

          // sort newest-first for mobile
          const sorted = [...reportsArray].sort(
            (a, b) => parseDateSafe(b) - parseDateSafe(a)
          );
          setPurchasedReports(sorted);

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
        console.error(
          'Error fetching profile (mobile):',
          err.message,
          err.stack
        );
        setError(
          `Failed to load profile data: ${err.message}. Check CORS configuration on the server.`
        );
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

  // ---- Load recently viewed for this user ----
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
      console.warn('Failed to load recently viewed (mobile):', e);
    }
  }, []);

  const hasPurchases = purchasedReports && purchasedReports.length > 0;

  const renderPurchasedOn = (r) => {
    const d =
      r.purchased_on ||
      r.granted_on ||
      r.granted_at ||
      r.created_at ||
      null;
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
  };

  // ---- Recently viewed tracking ----
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
            beautifyFileName(report.file_key) ||
            'Report',
        };

        const filtered = cleanPrev.filter(
          (r) => !(r.report_id === base.report_id && r.file_key === base.file_key)
        );

        const next = [
          { ...base, viewed_at: new Date().toISOString() },
          ...filtered,
        ].slice(0, 5);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.warn('Failed to persist recently viewed (mobile):', e);
    }
  };

  // ---- Presigned URL (mobile) ----
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
        throw new Error(
          `Failed to get presigned URL. HTTP ${resp.status}. Body: ${t}`
        );
      }

      const data = await resp.json().catch(() => ({}));
      console.log('Presigned URL payload (mobile):', data);

      if (!data?.presigned_url) {
        throw new Error('No presigned_url returned by Lambda');
      }

      trackRecentlyViewed(report);
      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL (mobile):', error);
      alert(
        `Failed to open the report. ${
          error?.message || ''
        }\n\nTip: Check Network tab -> the GET to the signed URL must be 200 with content-type application/pdf, and the URL must not be expired.`
      );
    } finally {
      setLoadingFileKey(null);
    }
  };

  // Sample card for no-purchase mobile view
  const sampleReport = useMemo(
    () => ({
      file_key: SAMPLE_FILE_KEY,
      report_version: SAMPLE_VERSION,
      _displayTitle: 'RBR Sample Report (Free Preview)',
      purchased_on: '—',
      _isSample: true,
    }),
    []
  );

  // ---- Photo upload ----
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
        throw new Error(
          `Failed to get presigned URL: ${response.status} - ${errorText}`
        );
      }
      const { presignedPutUrl, presignedGetUrl } = await response.json();

      const uploadResponse = await fetch(presignedPutUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        throw new Error(
          `Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`
        );
      }

      setPhotoUrl(presignedGetUrl);
      alert('Photo uploaded successfully!');
      const updatedUserInfo = {
        ...storedUserInfo,
        user_id: uid,
        photo_url: presignedGetUrl,
      };
      cxtDispatch({ type: 'USER_LOGIN', payload: updatedUserInfo });
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    } catch (error) {
      console.error('Error uploading photo (mobile):', error.message, error.stack);
      alert(`Unable to upload photo: ${error.message}`);
    } finally {
      setPhotoUploading(false);
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
            Authorization: `Bearer ${
              localStorage.getItem('authToken') || ''
            }`,
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
      console.error('Error saving profile (mobile):', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-mobile-loading">Loading...</div>;
  }

  if (error) {
    return <div className="profile-mobile-error">{error}</div>;
  }

  return (
    <div className="profile-page-mobile">
      {/* Top profile card */}
      <div className="profile-mobile-card profile-mobile-card--profile">
        <div className="profile-mobile-header">
          <img
            src={photoUrl || DEFAULT_PROFILE_ICON}
            alt="Profile"
            className="profile-mobile-photo"
            onError={(e) => {
              console.error('Mobile photo failed:', e);
              e.target.src = DEFAULT_PROFILE_ICON;
            }}
          />
          <div>
            <div className="profile-mobile-name">
              {nameInput || 'Not Available'}
            </div>
            <div className="profile-mobile-detail">
              📱 {userInfo?.phone || 'Not Available'}
            </div>
            <div className="profile-mobile-detail">
              ✉️ {emailInput || 'Not Available'}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary profile-mobile-edit-btn"
          onClick={() => setShowEditModal(true)}
        >
          Edit Profile
        </button>
      </div>

      {/* Purchased reports list */}
      <div className="profile-mobile-card profile-mobile-card--purchased">
        <div className="profile-mobile-section-title">Purchased reports</div>

        {hasPurchases ? (
          purchasedReports.map((r, idx) => {
            const isRowLoading = loadingFileKey === r.file_key;
            const displayTitle =
              r.report_title ||
              r.title ||
              beautifyFileName(r.file_key) ||
              'Report';

            const isLatest = idx === 0; // newest purchase

            return (
              <div
                key={r.file_key || displayTitle}
                className="profile-mobile-report-card"
              >
                <div className="profile-mobile-report-header">
                  <div className="profile-mobile-report-title">
                    {displayTitle}
                  </div>
                  {isLatest && (
                    <span className="profile-mobile-badge-recent">
                      ✨ Recently purchased
                    </span>
                  )}
                </div>

                {r.report_id && (
                  <div className="profile-mobile-report-id">
                    ID: {r.report_id}
                  </div>
                )}
                <div className="profile-mobile-report-meta">
                  <span>v{r.report_version || 'N/A'}</span>
                  <span>{renderPurchasedOn(r)}</span>
                </div>
                <button
                  className="btn btn-sm btn-primary profile-mobile-report-btn"
                  onClick={() => fetchPresignedUrl(r)}
                  disabled={isRowLoading}
                >
                  {isRowLoading ? 'Opening…' : 'View report'}
                </button>
              </div>
            );
          })
        ) : (
          <>
            <div className="profile-mobile-report-card">
              <div className="profile-mobile-report-title">
                {sampleReport._displayTitle}
              </div>
              <div className="profile-mobile-report-meta">
                <span>v{sampleReport.report_version || 'N/A'}</span>
                <span>—</span>
              </div>
              <button
                className="btn btn-sm btn-primary profile-mobile-report-btn"
                onClick={() => fetchPresignedUrl(sampleReport)}
                disabled={loadingFileKey === sampleReport.file_key}
              >
                {loadingFileKey === sampleReport.file_key
                  ? 'Opening…'
                  : 'View sample'}
              </button>
            </div>
            <p
              className="text-muted"
              style={{ marginTop: 6, fontSize: '0.8rem' }}
            >
              This is a sample report. Your purchased reports will appear here
              automatically after you buy them.
            </p>
          </>
        )}
      </div>

      {/* Recently viewed reports */}
      <div className="profile-mobile-card profile-mobile-card--recent">
        <div className="profile-mobile-section-title">Recently viewed</div>
        {recentlyViewed && recentlyViewed.length > 0 ? (
          <div>
            {recentlyViewed.map((r) => (
              <button
                key={`${r.report_id}-${r.file_key}`}
                type="button"
                className="profile-mobile-recent-pill"
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
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            When you open a report, it will show up here for quick access.
          </p>
        )}
      </div>

      {/* PDF viewer modal */}
      <Modal
        isOpen={!!selectedUrl}
        toggle={() => setSelectedUrl(null)}
        className="full-page-modal"
        size="xl"
        contentClassName="rbr-viewer-content"
      >
        <ModalHeader toggle={() => setSelectedUrl(null)}>
          Report Viewer
        </ModalHeader>
        <ModalBody className="rbr-viewer-body">
          {selectedUrl ? (
            <div
              className="rbr-viewer-scroll"
              onContextMenu={(e) => e.preventDefault()}
              style={{ height: '80vh' }}
            >
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={selectedUrl}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onDocumentLoadFailed={(e) =>
                    console.error('PDF load failed (mobile):', e)
                  }
                />
              </Worker>
            </div>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: '100%' }}
            >
              Loading…
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Edit Profile modal (reusing same endpoints) */}
      <Modal
        isOpen={showEditModal}
        toggle={() => setShowEditModal(false)}
        className="full-page-modal"
      >
        <ModalHeader toggle={() => setShowEditModal(false)}>
          Edit Profile
        </ModalHeader>
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
                onChange={handlePhotoUpload}
                className="form-control"
                disabled={photoUploading}
              />
              {photoUploading && <p>Uploading...</p>}
            </div>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={isSaving}
              style={{ width: '100%', marginTop: 8 }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSaving}
              style={{ width: '100%', marginTop: 8 }}
            >
              Cancel
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ProfilePageMobile;

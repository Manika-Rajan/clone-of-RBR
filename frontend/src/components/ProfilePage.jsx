import React, { useState, useEffect, useContext, useMemo } from 'react';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
// import PDFViewer from './PDFViewer';  // ⬅ keep file as-is, but we won’t use it here to avoid modal sizing issues
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

// 👇 Add the same viewer you use in ReportsDisplay
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

const DEFAULT_PROFILE_ICON = '/default-avatar.png';

// Sample fallback row
const SAMPLE_FILE_KEY = 'samples/RBR_Welcome_Sample.pdf';
const SAMPLE_VERSION = '1.0';

const ProfilePage = () => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();

  const [purchasedReports, setPurchasedReports] = useState([]);
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

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    let storedUserId =
      storedUserInfo?.user_id ||
      storedUserInfo?.userId ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('userId');

    let authToken = localStorage.getItem('authToken') || '';

    if (!storedUserId) {
      console.warn('User ID missing.');
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

    let isActive = true;

    const fetchProfile = async () => {
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
          setPurchasedReports(Array.isArray(data.reports) ? data.reports : []);
          setNameInput(data.name || '');
          setEmailInput(data.email || '');
          const fetchedPhotoUrl = data.photo_url || null;
          setPhotoUrl(fetchedPhotoUrl);

          // only dispatch if values actually changed
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
              `Failed to fetch profile (Status: ${response.status}) - ${data.message || 'No additional details'}`
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

    fetchProfile();
    return () => {
      isActive = false;
    };
  }, [cxtDispatch, userInfo?.user_id]);

  // Use existing presigned-URL Lambda
  const fetchPresignedUrl = async (fileKey) => {
    try {
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

      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      alert(
        `Failed to open the report. ${
          error?.message || ''
        }\n\nTip: Check Network tab -> the GET to the signed URL must be 200 with content-type application/pdf, and the URL must not be expired.`
      );
    } finally {
      setLoadingFileKey(null);
    }
  };

  // Fallback: sample row if no purchased reports
  const displayReports = useMemo(() => {
    if (purchasedReports && purchasedReports.length > 0) return purchasedReports;
    return [
      {
        file_key: SAMPLE_FILE_KEY,
        report_version: SAMPLE_VERSION,
        title: 'RBR Sample Report (Free Preview)',
        purchased_on: '—',
        _isSample: true,
      },
    ];
  }, [purchasedReports]);

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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
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

  return (
    <div className="profile-page">
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
              <p className="user-detail"><strong>Phone:</strong> {userInfo?.phone || 'Not Available'}</p>
              <p className="user-detail"><strong>Email:</strong> {emailInput || 'Not Available'}</p>
              <button className="edit-profile-button" onClick={() => setShowEditModal(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Purchased Reports */}
        <div className="reports-section">
          <h3 className="section-title">Purchased Reports</h3>

          {displayReports.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped align-middle rbr-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Report</th>
                    <th>Version</th>
                    <th>Purchased on</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayReports.map((r) => {
                    const fileName = r.title || r.file_key?.split('/').pop() || 'report.pdf';
                    const isRowLoading = loadingFileKey === r.file_key;
                    return (
                      <tr key={r.file_key || fileName}>
                        <td>{fileName}</td>
                        <td>{r.report_version || 'N/A'}</td>
                        <td>{renderPurchasedOn(r)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => fetchPresignedUrl(r.file_key)}
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
              {purchasedReports.length === 0 && (
                <p className="text-muted" style={{ marginTop: 8 }}>
                  This is a sample preview added for new accounts. Your purchased reports will appear here automatically.
                </p>
              )}
            </div>
          ) : (
            <p className="no-reports">No purchased reports found.</p>
          )}
        </div>

        {/* Inline PDF viewer modal (no change to your PDFViewer.jsx file) */}
        <Modal
          isOpen={!!selectedUrl}
          toggle={() => setSelectedUrl(null)}
          className="full-page-modal"
          size="xl"
        >
          <ModalHeader toggle={() => setSelectedUrl(null)}>Report Viewer</ModalHeader>
          <ModalBody style={{ height: '80vh', padding: 0 }}>
            {selectedUrl ? (
              <div style={{ height: '100%', width: '100%' }} onContextMenu={(e) => e.preventDefault()}>
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={selectedUrl}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    // If you prefer page-fit: defaultScale={SpecialZoomLevel.PageFit}
                    onDocumentLoadFailed={(e) => {
                      console.error('PDF load failed:', e);
                    }}
                  />
                </Worker>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                Loading…
              </div>
            )}
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
                {!photoUrl && !photoUploading && <p>No photo uploaded. Upload to set a profile picture.</p>}
                {photoUrl && (
                  <button className="btn btn-danger" onClick={handleRemovePhoto} disabled={isSaving}>
                    {isSaving ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={isSaving}>
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

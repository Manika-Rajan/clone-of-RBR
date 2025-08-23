import React, { useState, useEffect, useContext } from 'react';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

// Default profile icon URL (using local path from public folder)
const DEFAULT_PROFILE_ICON = '/default-avatar.png';

const ProfilePage = () => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();

  const [purchasedReports, setPurchasedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [nameInput, setNameInput] = useState(userInfo?.name || '');
  const [emailInput, setEmailInput] = useState(userInfo?.email || '');
  const [photoUrl, setPhotoUrl] = useState(userInfo?.photo_url || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);

  useEffect(() => {
    console.log("ProfilePage mounted. State:", state);

    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    let storedUserId =
      storedUserInfo?.user_id ||
      storedUserInfo?.userId ||
      localStorage.getItem('user_id') ||
      localStorage.getItem('userId');
    let authToken = localStorage.getItem('authToken') || '';
    console.log("Stored user_id:", storedUserId, "Stored userInfo:", storedUserInfo, "authToken:", authToken);
    if (!storedUserId) {
      console.warn('User ID missing.');
      setLoading(false);
      setError('User ID not found. Please log in again.');
      return;
    }

    // ensure normalized storage (always user_id)
    localStorage.setItem('user_id', storedUserId);
    if (storedUserInfo) {
      storedUserInfo.user_id = storedUserId;
      delete storedUserInfo.userId;
      localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));
    }

    // Set authToken if missing but present in userInfo
    if (!authToken && storedUserInfo?.token) {
      authToken = storedUserInfo.token;
      localStorage.setItem('authToken', authToken);
      console.log('Updated authToken from userInfo:', authToken);
    }

    if (!userInfo?.user_id) {
      cxtDispatch({ type: 'SET_USER_ID', payload: storedUserId });
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/getUserProfile-RBRmain-APIgateway', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ user_id: storedUserId })
        });
        console.log("API response status:", response.status, "Headers:", Object.fromEntries(response.headers));
        const data = await response.json();
        console.log("API response data:", data);
        if (response.ok) {
          setPurchasedReports(data.reports || []);
          setNameInput(data.name || '');
          setEmailInput(data.email || '');
          const fetchedPhotoUrl = data.photo_url || null;
          setPhotoUrl(fetchedPhotoUrl);
          console.log('Fetched photoUrl:', fetchedPhotoUrl);
          const normalizedUserInfo = { 
            isLogin: true, 
            user_id: storedUserId, 
            name: data.name, 
            email: data.email, 
            phone: data.phone, 
            photo_url: fetchedPhotoUrl, 
            token: authToken 
          };
          cxtDispatch({ type: 'USER_LOGIN', payload: normalizedUserInfo });
          localStorage.setItem('userInfo', JSON.stringify(normalizedUserInfo));
        } else {
          throw new Error(data.error || `Failed to fetch profile (Status: ${response.status}) - ${data.message || 'No additional details'}`);
        }
      } catch (err) {
        console.error('Error fetching profile:', err.message, err.stack);
        setError(`Failed to load profile data: ${err.message}. Check CORS configuration on the server.`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [cxtDispatch, userInfo?.user_id]);

  const fetchPresignedUrl = async (fileKey) => {
    try {
      const response = await fetch(
        'https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_key: fileKey }),
        }
      );
      if (!response.ok) throw new Error('Failed to get presigned URL');
      const data = await response.json();
      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      alert('Failed to open the report.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const user_id = storedUserInfo?.user_id || localStorage.getItem('user_id');
    const authToken = localStorage.getItem('authToken') || '';
    console.log('Attempting upload with user_id:', user_id, 'authToken:', authToken);
    if (!user_id) {
      console.error('user_id is undefined or missing');
      alert('Failed to upload photo: user_id is undefined or missing');
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
            'Authorization': `Bearer ${authToken}` 
          },
          body: JSON.stringify({ user_id }),
        }
      );
      console.log('Presigned URL fetch response status:', response.status, 'Headers:', Object.fromEntries(response.headers));
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`);
      }
      const { presignedPutUrl, presignedGetUrl } = await response.json();
      console.log('Presigned PUT URL received:', presignedPutUrl, 'Presigned GET URL:', presignedGetUrl);
      const uploadResponse = await fetch(presignedPutUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      console.log('S3 upload response status:', uploadResponse.status, 'Headers:', Object.fromEntries(uploadResponse.headers));
      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        throw new Error(`Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`);
      }
      setPhotoUrl(presignedGetUrl);
      setNewPhoto(null);
      console.log('Photo upload successful, photoUrl set to presigned GET URL:', presignedGetUrl);
      alert('Photo uploaded successfully!');
      const updatedUserInfo = { ...storedUserInfo, user_id, photo_url: presignedGetUrl };
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify(profileData),
        }
      );
      if (!response.ok) throw new Error('Failed to remove photo');
      console.log("Remove photo response:", await response.json());
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` },
          body: JSON.stringify(profileData),
        }
      );
      if (!response.ok) throw new Error('Failed to save profile');
      console.log("Save profile response:", await response.json());
      alert('Profile saved successfully');
      const updatedUserInfo = { ...storedUserInfo, user_id, name: nameInput, email: emailInput, phone: profileData.phone, photo_url: photoUrl };
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

  console.log('Rendering photo section, photoUrl:', photoUrl, 'Default icon:', DEFAULT_PROFILE_ICON);

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
                    console.error('Photo URL failed to load:', e, 'Falling back to default');
                    e.target.src = DEFAULT_PROFILE_ICON;
                  }}
                  onLoad={() => console.log('Photo loaded successfully:', photoUrl)}
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

        <div className="reports-section">
          <h3 className="section-title">Purchased Reports</h3>
          {purchasedReports.length > 0 ? (
            <div className="reports-list">
              {purchasedReports.map((report) => (
                <div key={report.file_key} className="report-card">
                  <button
                    onClick={() => fetchPresignedUrl(report.file_key)}
                    className="report-button"
                  >
                    {report.file_key.split('/').pop()} (Version: {report.report_version || 'N/A'})
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reports">No purchased reports found.</p>
          )}
        </div>

        {selectedUrl && <PDFViewer pdfUrl={selectedUrl} onClose={() => setSelectedUrl(null)} />}

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

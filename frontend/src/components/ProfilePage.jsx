import React, { useState, useEffect, useContext } from 'react';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

// Default profile icon URL (replace with your asset or a public URL)
const DEFAULT_PROFILE_ICON = 'https://via.placeholder.com/120?text=Default+Avatar';

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
    const storedUserId = storedUserInfo?.userId || localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken') || '';
    console.log("Stored userId:", storedUserId, "Stored userInfo:", storedUserInfo, "authToken:", authToken);
    if (!storedUserId) {
      console.warn('User ID missing.');
      setLoading(false);
      setError('User ID not found. Please log in again.');
      return;
    }

    if (!userInfo?.userId) {
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
          setPhotoUrl(data.photo_url || null);
          cxtDispatch({
            type: 'USER_LOGIN',
            payload: { isLogin: true, userId: storedUserId, name: data.name, email: data.email, phone: data.phone, photo_url: data.photo_url }
          });
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
  }, [cxtDispatch, userInfo?.userId]);

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
    const userId = storedUserInfo?.userId;
    if (!userId) {
      console.error('userId is undefined');
      alert('Failed to upload photo: userId is undefined');
      return;
    }

    setPhotoUploading(true);
    try {
      const response = await fetch(
        'https://70j2ry7zol.execute-api.ap-south-1.amazonaws.com/default/generate-photo-presigned-url',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` },
          body: JSON.stringify({ userId }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`);
      }
      const { presignedUrl, photoUrl: newPhotoUrl } = await response.json();
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        throw new Error(`Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`);
      }
      setPhotoUrl(newPhotoUrl);
      setNewPhoto(null); // Clear the new photo input after upload
      console.log('Photo upload successful, photoUrl set:', newPhotoUrl);
      alert('Photo uploaded successfully!');
      cxtDispatch({ type: 'SET_PHOTO_URL', payload: newPhotoUrl });
    } catch (error) {
      console.error('Error uploading photo:', error.message, error.stack);
      alert(`Unable to upload photo: ${error.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveProfile = async () => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    const userId = storedUserInfo?.userId;
    if (!userId) {
      alert('User ID is missing.');
      return;
    }

    const profileData = {
      user_id: userId,
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
      cxtDispatch({
        type: 'USER_LOGIN',
        payload: { isLogin: true, userId, name: nameInput, email: emailInput, phone: profileData.phone, photo_url: photoUrl }
      });
      setShowEditModal(false); // Close the modal after successful save
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="user-info">
            <div className="photo-section">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="profile-photo" />
              ) : (
                <img src={DEFAULT_PROFILE_ICON} alt="Default Profile" className="profile-photo" />
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
          <button className="save-button" onClick={saveProfile} disabled={isSaving} style={{ display: 'none' }}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
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
                    handlePhotoUpload(e); // Trigger upload immediately
                  }}
                  className="form-control"
                  disabled={photoUploading}
                />
                {photoUploading && <p>Uploading...</p>}
                {!photoUrl && !photoUploading && <p>No photo uploaded. Upload to set a profile picture.</p>}
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

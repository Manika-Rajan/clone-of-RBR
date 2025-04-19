import React, { useEffect, useState, useContext } from 'react';
import Navbar from './Navbar';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

const ProfilePage = () => {
  const { state, dispatch } = useContext(Store);
  const { isLogin, userId, name, phone, email } = state;
  const [purchasedReports, setPurchasedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [nameInput, setNameInput] = useState(name || '');
  const [emailInput, setEmailInput] = useState(email || '');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("ProfilePage mounted. State:", state);

    if (!isLogin) {
      navigate('/');
      return;
    }

    const storedUserId = userId || localStorage.getItem('userId');
    if (!storedUserId) {
      console.warn('User ID missing.');
      setLoading(false);
      setError('User ID not found. Please log in again.');
      return;
    }

    if (!userId) {
      dispatch({ type: 'SET_USER_ID', payload: storedUserId });
    }

    const fetchPurchasedReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://xdueps3m8l.execute-api.ap-south-1.amazonaws.com/fetchPurchasedReports-RBRmain-API?user_id=${storedUserId}`
        );
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        console.log('Fetched reports:', data);
        setPurchasedReports(data.reports || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load purchased reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedReports();

    const fetchProfilePhoto = async () => {
      try {
        const response = await fetch(
          'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: storedUserId }),
          }
        );
        const data = await response.json();
        if (data.photo_url) setPhotoUrl(data.photo_url);
      } catch (err) {
        console.error('Error fetching profile photo:', err);
      }
    };
    fetchProfilePhoto();
  }, [isLogin, userId, navigate, dispatch]);

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
    console.log('Current userId:', userId);
    if (!userId) {
      console.error('userId is undefined');
      alert('Failed to upload photo: userId is undefined');
      return;
    }

    setPhotoUploading(true);
    try {
      console.log('Fetching presigned URL for userId:', userId);
      const response = await fetch(
        'https://70j2ry7zol.execute-api.ap-south-1.amazonaws.com/default/generate-photo-presigned-url',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );
      console.log('Presigned URL response:', response ? response.status : 'No response');
      if (!response) {
        throw new Error('No response from server');
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`);
      }
      const { presignedUrl, photoUrl } = await response.json();
      console.log('Presigned URL received:', presignedUrl);
      console.log('Photo URL:', photoUrl);

      console.log('Uploading file to S3...');
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      console.log('S3 upload response:', uploadResponse ? uploadResponse.status : 'No response');
      if (!uploadResponse) {
        throw new Error('No response from S3');
      }
      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        throw new Error(`Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`);
      }

      setPhotoUrl(photoUrl);
      console.log('Photo upload successful, photoUrl set:', photoUrl);
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error.message);
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const updateName = () => {
    dispatch({ type: 'SET_NAME', payload: nameInput });
    setShowNameModal(false);
  };

  const updateEmail = () => {
    dispatch({ type: 'SET_EMAIL', payload: emailInput });
    setShowEmailModal(false);
  };

  const saveProfile = async () => {
    if (!userId) {
      alert('User ID is missing.');
      return;
    }

    const profileData = {
      user_id: userId,
      name: nameInput,
      email: emailInput,
      phone: phone || '',
      photo_url: photoUrl || '',
    };

    setIsSaving(true);
    try {
      const response = await fetch(
        'https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        }
      );
      if (!response.ok) throw new Error('Failed to save profile');
      alert('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Navbar profile />
      <div className="profile-container">
        <div className="profile-card">
          <div className="user-info">
            <div className="photo-section">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="profile-photo" />
              ) : (
                <div className="upload-photo-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    id="photo-upload-input"
                    name="photoUpload"
                    className="photo-input"
                    disabled={photoUploading}
                  />
                  <label htmlFor="photo-upload-input" className="upload-photo-label">
                    <button
                      type="button"
                      disabled={photoUploading}
                      className="upload-button"
                    >
                      {photoUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </label>
                </div>
              )}
            </div>
            <div className="info-section">
              <h2 className="user-name">
                {name || (
                  <span className="update-link" onClick={() => setShowNameModal(true)}>
                    Update Name
                  </span>
                )}
              </h2>
              <p className="user-detail">
                <strong>Phone:</strong> {phone || 'Not Available'}
              </p>
              <p className="user-detail">
                <strong>Email:</strong>{' '}
                {email || (
                  <span className="update-link" onClick={() => setShowEmailModal(true)}>
                    Update Email
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="save-button" onClick={saveProfile} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="reports-section">
          <h3 className="section-title">Purchased Reports</h3>
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : purchasedReports.length > 0 ? (
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

        <Modal isOpen={showNameModal} toggle={() => setShowNameModal(false)} className="profile-modal">
          <ModalHeader toggle={() => setShowNameModal(false)}>Update Name</ModalHeader>
          <ModalBody>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="form-control"
              placeholder="Enter your name"
            />
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={updateName}>
                Update
              </button>
              <button className="btn btn-secondary" onClick={() => setShowNameModal(false)}>
                Cancel
              </button>
            </div>
          </ModalBody>
        </Modal>

        <Modal isOpen={showEmailModal} toggle={() => setShowEmailModal(false)} className="profile-modal">
          <ModalHeader toggle={() => setShowEmailModal(false)}>Update Email</ModalHeader>
          <ModalBody>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="form-control"
              placeholder="Enter your email"
            />
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={updateEmail}>
                Update
              </button>
              <button className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
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

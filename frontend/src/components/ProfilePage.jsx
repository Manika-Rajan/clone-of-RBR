import React, { useEffect, useState, useContext } from 'react';
import Navbar from './Navbar';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';

const ProfilePage = () => {
  const { state, dispatch } = useContext(Store);
  const { isLoggedIn, userId } = state;
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(state.photoUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const fetchReports = async () => {
      try {
        const response = await fetch('https://your-api-gateway-url/fetchPurchasedReports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [isLoggedIn, userId, navigate]);

  const viewReport = async (fileKey) => {
    try {
      const response = await fetch('https://your-api-gateway-url/getPresignedUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_key: fileKey }),
      });

      if (!response.ok) throw new Error('Failed to fetch URL');
      const data = await response.json();
      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      console.log('Uploading photo for user:', userId);
      const response = await fetch('https://6kslo2oose.execute-api.ap-south-1.amazonaws.com/getPresignedPhotoUploadUrl-RBRmain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, file_name: file.name }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      const data = await response.json();
      const uploadUrl = data.upload_url;
      const fileKey = data.file_key;

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const publicUrl = `https://rbrmain-userpictures.s3.amazonaws.com/${fileKey}`;
      setPhotoUrl(publicUrl);
      dispatch({ type: 'SET_PHOTO', payload: publicUrl });
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        user_id: userId,
        name: state.name,
        email: state.email,
        phone: state.phone,
        photo_url: photoUrl,
        reports,
      };

      console.log('Sending profile data:', profileData);
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to save profile');
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Navbar profile />
      <div className="profile-container">
        <div className="user-info">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="profile-photo" />
          ) : (
            <label className="upload-photo-label">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
              <button>Upload Photo</button>
            </label>
          )}

          <div>
            <h2>
              {state.name || (
                <span className="update-link" onClick={() => setShowNameModal(true)}>
                  Update Name
                </span>
              )}
            </h2>
            <p><strong>Phone:</strong> {state.phone || 'Not Available'}</p>
            <p><strong>Email:</strong> {state.email ? state.email : (
              <span className="update-link" onClick={() => setShowEmailModal(true)}>Update Email</span>
            )}</p>
          </div>
        </div>

        <button className="save-button" onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>

        <h3>Purchased Reports</h3>
        <ul>
          {reports.length === 0 ? (
            <p>No purchased reports</p>
          ) : (
            reports.map((report) => (
              <li key={report.file_key}>
                <button onClick={() => viewReport(report.file_key)}>
                  {report.file_key} (Version: {report.report_version})
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {selectedUrl && (
        <PDFViewer fileUrl={selectedUrl} onClose={() => setSelectedUrl(null)} />
      )}

      {/* Modals */}
      {showNameModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Your Name</h3>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <button onClick={updateName}>Update</button>
            <button onClick={() => setShowNameModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Your Email</h3>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            <button onClick={updateEmail}>Update</button>
            <button onClick={() => setShowEmailModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

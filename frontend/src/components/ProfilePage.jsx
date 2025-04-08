import React, { useEffect, useState, useContext } from 'react';
import Navbar from './Navbar';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';

const ProfilePage = () => {
  const { state, dispatch } = useContext(Store);
  const { isLogin, userId, name, phone, email } = state; // Changed to isLogin
  const [purchasedReports, setPurchasedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [nameInput, setNameInput] = useState(name || '');
  const [emailInput, setEmailInput] = useState(email || '');
  const [photoUrl, setPhotoUrl] = useState(state.photoUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("ProfilePage mounted. State:", state);

    if (!isLogin) {
      navigate('/'); // Redirect to home if not logged in
      return;
    }

    let storedUserId = userId || localStorage.getItem('userId');

    if (!storedUserId || storedUserId === '') {
      console.warn('🚨 User ID missing. Profile data cannot be loaded.');
      return;
    }

    console.log("Retrieved userId:", storedUserId);

    if (!userId || userId === '') {
      dispatch({ type: 'SET_USER_ID', payload: storedUserId });
    }

    localStorage.setItem('userId', storedUserId);

    const fetchReports = async () => {
      try {
        const response = await fetch(
          `https://xdueps3m8l.execute-api.ap-south-1.amazonaws.com/fetchPurchasedReports-RBRmain-API?user_id=${storedUserId}`
        );
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        console.log('Fetched reports:', data); // Debug
        setReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();

    const fetchPurchasedReports = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const response = await fetch('YOUR_BACKEND_GET_REPORTS_ENDPOINT', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        setPurchasedReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchasedReports();
  }, [isLogin, userId, navigate, dispatch, name, phone, email]);

  const fetchPresignedUrl = async (fileKey) => {
    try {
      const response = await fetch(
        `https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL`, // Updated to match ReportsDisplay
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_key: fileKey }),
        }
      );
      if (!response.ok) throw new Error('Failed to get presigned URL');
      const data = await response.json();
      console.log('Presigned URL response:', data); // Debug
      setSelectedUrl(data.presigned_url);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      alert('Failed to open the report.');
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
    console.log("Current userId:", userId);
    if (!userId) {
      alert('User ID is missing. Unable to save profile.');
      return;
    }

    const profileData = {
      user_id: userId,
      name: nameInput,
      email: emailInput,
      phone: phone || '',
      photo_url: photoUrl || ''
    };

    console.log('Sending profile data:', profileData);

    setIsSaving(true);
    try {
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to save profile: ' + errorText);
      }

      alert('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Check console for details.');
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
              <input type="file" accept="image/*" onChange={(e) => {}} hidden />
              <button>Upload Photo</button>
            </label>
          )}

          <div>
            <h2>
              {name || (
                <span className="update-link" onClick={() => setShowNameModal(true)}>
                  Update Name
                </span>
              )}
            </h2>
            <p><strong>Phone:</strong> {phone || 'Not Available'}</p>
            <p><strong>Email:</strong> {email ? email : (
              <span className="update-link" onClick={() => setShowEmailModal(true)}>Update Email</span>
            )}</p>
          </div>
        </div>

        <button className="save-button" onClick={saveProfile} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>

        <h3>Purchased Reports</h3>
        {loading ? (
                <p>Loading...</p>
              ) : purchasedReports.length > 0 ? (
                <ul>
                  {purchasedReports.map((report) => (
                    <li key={report.paymentId}>
                      <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
                        {report.fileName} ({new Date(report.purchasedAt).toLocaleDateString()})
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
          <p>No purchased reports found.</p>
        ) : (
          <ul>
            {reports.map((report) => (
              <li key={report.file_key}>
                <button onClick={() => fetchPresignedUrl(report.file_key)}>
                  {report.file_key} (Version: {report.report_version || 'N/A'})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedUrl && <PDFViewer pdfUrl={selectedUrl} onClose={() => setSelectedUrl(null)} />}

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

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("ProfilePage mounted. State:", state);

    if (!isLogin) {
      navigate('/');
      return;
    }

    const storedUserId = userId || localStorage.getItem('userId');
    if (!storedUserId) {
      console.warn('User ID missing. Profile data cannot be loaded.');
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
      console.log('Presigned URL response:', data);
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
    if (!userId) {
      alert('User ID is missing. Unable to save profile.');
      return;
    }

    const profileData = {
      user_id: userId,
      name: nameInput,
      email: emailInput,
      phone: phone || '',
    };

    console.log('Sending profile data:', profileData);

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
    <div>
      <Navbar profile />
      <div className="profile-container">
        <div className="user-info">
          <label className="upload-photo-label">
            <input type="file" accept="image/*" onChange={(e) => console.log('Photo upload TBD')} hidden />
            <button>Upload Photo</button>
          </label>

          <div>
            <h2>
              {name || (
                <span className="update-link" onClick={() => setShowNameModal(true)}>
                  Update Name
                </span>
              )}
            </h2>
            <p><strong>Phone:</strong> {phone || 'Not Available'}</p>
            <p>
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

        <h3>Purchased Reports</h3>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : purchasedReports.length > 0 ? (
          <ul>
            {purchasedReports.map((report) => (
              <li key={report.file_key}>
                <button onClick={() => fetchPresignedUrl(report.file_key)}>
                  {report.file_key.split('/').pop()} (Version: {report.report_version || 'N/A'})
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No purchased reports found.</p>
        )}

        {selectedUrl && <PDFViewer pdfUrl={selectedUrl} onClose={() => setSelectedUrl(null)} />}

        <Modal isOpen={showNameModal} toggle={() => setShowNameModal(false)}>
          <ModalHeader toggle={() => setShowNameModal(false)}>Update Name</ModalHeader>
          <ModalBody>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="form-control"
              placeholder="Enter your name"
            />
            <button className="btn btn-primary mt-2" onClick={updateName}>
              Update
            </button>
            <button className="btn btn-secondary mt-2 ml-2" onClick={() => setShowNameModal(false)}>
              Cancel
            </button>
          </ModalBody>
        </Modal>

        <Modal isOpen={showEmailModal} toggle={() => setShowEmailModal(false)}>
          <ModalHeader toggle={() => setShowEmailModal(false)}>Update Email</ModalHeader>
          <ModalBody>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="form-control"
              placeholder="Enter your email"
            />
            <button className="btn btn-primary mt-2" onClick={updateEmail}>
              Update
            </button>
            <button className="btn btn-secondary mt-2 ml-2" onClick={() => setShowEmailModal(false)}>
              Cancel
            </button>
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;

import React, { useState, useEffect, useContext } from 'react';
import './ProfilePage.css';
import { Store } from '../Store';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ProfilePage = () => {
  const { state, dispatch: cxtDispatch } = useContext(Store);
  const { userInfo } = state;
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (userInfo?.userId) {
      fetchProfile();
    } else {
      setError('User not authenticated or userId missing');
      setIsLoading(false);
    }
  }, [userInfo?.userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const userId = userInfo.userId;
      console.log('Fetching profile for userId:', userId); // Debug log
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/getUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` // Add auth header
        },
        body: JSON.stringify({ user_id: userId })
      });
      console.log('fetchProfile response status:', response.status); // Debug log
      const data = await response.json();
      console.log('fetchProfile response data:', data); // Debug log
      if (response.ok) {
        setProfileData(data);
        setNameInput(data.name || '');
        setEmailInput(data.email || '');
        setPhotoUrl(data.photo_url || '');
      } else {
        setError(data.error || `Failed to fetch profile (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('fetchProfile error:', err.message, err.stack);
      setError('An error occurred while fetching profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userId = userInfo.userId;
      const profileData = {
        user_id: userId,
        name: nameInput,
        email: emailInput,
        phone: userInfo.phone || '',
        photo_url: photoUrl || '',
      };
      console.log('Sending profile data to API:', profileData);
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      console.log('API response:', data);
      if (response.ok) {
        fetchProfile(); // Refresh profile data
        setIsModalOpen(false);
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('An error occurred while saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseReport = async (reportName) => {
    setIsLoading(true);
    setError('');
    try {
      const userId = userInfo.userId;
      const profileData = {
        user_id: userId,
        report_name: reportName
      };
      console.log('Sending purchase data to API:', profileData);
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      console.log('API response for purchase:', data);
      if (response.ok) {
        fetchProfile(); // Refresh to show new report
      } else {
        setError(data.error || 'Failed to purchase report');
      }
    } catch (err) {
      setError('An error occurred while purchasing report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = async (reportName) => {
    setIsLoading(true);
    setError('');
    try {
      const userId = userInfo.userId;
      const currentTime = new Date().toISOString();
      const profileData = {
        user_id: userId,
        report_name: reportName,
        last_viewed_on: currentTime
      };
      console.log('Sending view data to API:', profileData);
      const response = await fetch('https://kwkxhezrsj.execute-api.ap-south-1.amazonaws.com/saveUserProfile-RBRmain-APIgateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      console.log('API response for view:', data);
      if (response.ok) {
        fetchProfile(); // Refresh to update last viewed
      } else {
        setError(data.error || 'Failed to update view');
      }
    } catch (err) {
      setError('An error occurred while updating view');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profileData) return null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="user-info">
            <div className="photo-section">
              <img src={photoUrl || 'https://via.placeholder.com/120'} alt="Profile" className="profile-photo" />
              <div className="modify-link" onClick={() => setIsModalOpen(true)}>Modify</div>
            </div>
            <div className="info-section">
              <div className="user-name">{profileData.name}</div>
              <div className="user-detail">Email: {profileData.email}</div>
              <div className="user-detail">Phone: {userInfo.phone || 'Not provided'}</div>
            </div>
          </div>
          <div className="reports-section">
            <div className="section-title">Purchased Reports</div>
            <div className="reports-list">
              {profileData.reports && profileData.reports.length > 0 ? (
                profileData.reports.map((report, index) => (
                  <div key={index} className="report-card">
                    <button className="report-button" onClick={() => handleViewReport(report.name)}>
                      {report.name} (Purchased: {report.purchased_on}, Updated: {report.updated_on}, Last Viewed: {report.last_viewed_on || 'Never'})
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-reports">No reports purchased yet.</div>
              )}
            </div>
            <button
              className="save-button"
              onClick={() => handlePurchaseReport('Sample Report')}
              disabled={isLoading}
            >
              Purchase Sample Report
            </button>
          </div>
        </div>
      </div>

      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)} className="profile-modal">
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            className="custom-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Name"
          />
          <input
            type="email"
            className="custom-input"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Email"
          />
          <input
            type="text"
            className="custom-input"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Photo URL"
          />
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </Modal.Body>
        <Modal.Footer className="modal-buttons">
          <Button variant="secondary" className="custom-cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" className="custom-submit" onClick={saveProfile} disabled={isLoading}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfilePage;

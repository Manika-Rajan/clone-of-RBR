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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // You can upload this file to S3 here
      const localUrl = URL.createObjectURL(file);
      dispatch({ type: 'SET_PHOTO', payload: localUrl });
      setPhotoFile(localUrl);
    }
  };

  return (
    <div>
      <Navbar profile />
      <div className='profile-container'>
        <div className="user-info">
          {state.photoUrl || photoFile ? (
            <img src={state.photoUrl || photoFile} alt="Profile" className="profile-photo" />
          ) : (
            <div>
              <label className="upload-photo-label">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                <button>Upload Photo</button>
              </label>
            </div>
          )}
          <div>
            <h2>
              {state.name || (
                <span className="update-link" onClick={() => setShowNameModal(true)}>Update Name</span>
              )}
            </h2>
            <p><strong>Phone:</strong> {state.phone || 'Not Available'}</p>
            <p><strong>Email:</strong> {state.email ? state.email : (
              <span className="update-link" onClick={() => setShowEmailModal(true)}>Update Email</span>
            )}</p>
          </div>
        </div>

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

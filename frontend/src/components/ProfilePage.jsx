import React, { useEffect, useState, useContext } from 'react';
import Navbar from './Navbar';
import './ProfilePage.css';
import { Store } from '../Store';
import { useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';

const ProfilePage = () => {
  const { state } = useContext(Store);
  const { isLoggedIn, userId } = state;
  console.log("ProfilePage - isLogin:", isLogin);
  console.log("ProfilePage - userId:", userId);
  console.log("ProfilePage - state:", state);

  const [reports, setReports] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login'); // Redirect to login if not logged in
      return;
    }

    // Fetch purchased reports from backend (DynamoDB via Lambda)
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
  }, [isLogin, userId, navigate]);

  // Function to fetch presigned URL and open the report
  const viewReport = async (fileKey) => {
    try {
      const response = await fetch('https://your-api-gateway-url/getPresignedUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_key: fileKey }),
      });

      if (!response.ok) throw new Error('Failed to fetch URL');
      
      const data = await response.json();
      const presignedUrl = data.presigned_url;
      setSelectedUrl(presignedUrl); // open in custom viewer instead of new tab
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
    }
  };

  return (
    <div>
      <Navbar profile />
      <div className='profile-container'>
        <div className="user-info">
            <img src={state.photoUrl || '/default-profile.png'} alt="Profile" className="profile-photo" />
            <div>
              <h2>{state.name || userId}</h2>
              <p><strong>Phone:</strong> {state.phone || 'Not Available'}</p>
              <p><strong>Email:</strong> {state.email || 'Not Available'}</p>
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
    </div>
  );
};

export default ProfilePage;

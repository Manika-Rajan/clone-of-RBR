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
  const [photoUrl, setPhotoUrl] = useState(state.photoUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const fetchOrGenerateUserId = async () => {
      if (!userId) {
        try {
          const response = await fetch('https://your-api-url.com/generateUserId-RBRmain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) throw new Error('Failed to generate user ID');
          const data = await response.json();
          dispatch({ type: 'SET_USER_ID', payload: data.user_id });
        } catch (error) {
          console.error('Error generating user ID:', error);
        }
      }
    };

    fetchOrGenerateUserId();
  }, [isLoggedIn, userId, dispatch, navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchReports = async () => {
      try {
        const response = await fetch(`https://xdueps3m8l.execute-api.ap-south-1.amazonaws.com/fetchPurchasedReports-RBRmain-API?user_id=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [userId]);

  const handleSaveProfile = async () => {
    if (!userId) {
      alert('User ID is missing. Cannot save profile.');
      return;
    }

    setIsSaving(true);
    try {
      const profileData = {
        user_id: userId,
        name: state.name || '',
        email: state.email || '',
        phone: state.phone || '',
        photo_url: photoUrl || '',
        reports,
      };

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
        <button className="save-button" onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

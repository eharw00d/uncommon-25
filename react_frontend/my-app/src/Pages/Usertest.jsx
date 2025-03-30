import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../services/api';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfile = () => {
  const { userApi } = useApi();
  const { user: auth0User } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (loading) {
      try {
        const data = await userApi.getProfile();
        setProfile(data);
        
        // Check if this looks like a default profile
        const needsUpdate = data.name.includes('|') || data.email.includes('@example.com');
        
        if (needsUpdate && auth0User) {
          // Pre-fill form with Auth0 data
          setFormData({
            name: auth0User.name || auth0User.nickname || '',
            email: auth0User.email || ''
          });
          setEditMode(true);
        } else {
          // Use existing data
          setFormData({
            name: data.name || '',
            email: data.email || ''
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [userApi, auth0User, loading]);
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedProfile = await userApi.updateProfile(formData);
      setProfile(updatedProfile);
      setEditMode(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleEditMode = () => {
    if (!editMode) {
      // Entering edit mode - update form data with current profile
      setFormData({
        name: profile?.name || '',
        email: profile?.email || ''
      });
    }
    setEditMode(!editMode);
  };
  
  // Render loading state
  if (loading && !profile) {
    return <div className="loading">Loading your profile...</div>;
  }
  
  // Render profile content
  return (
    <div className="profile-container">
      {/* Success message */}
      {updateSuccess && (
        <div className="success-message">
          Profile updated successfully!
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => { setLoading(true); setError(null); }}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Profile edit form */}
      {profile && editMode && (
        <div className="edit-form">
          <h2>Update Your Profile</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="button-group">
              <button type="submit" disabled={loading} className="save-button">
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={toggleEditMode} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Profile display */}
      {profile && !editMode && (
        <div className="profile-view">
          <h1>Welcome, {profile.name}</h1>
          <p>Email: {profile.email}</p>
          <p>Poses completed: {profile.poses_done?.length || 0}</p>
          <p>Poses created: {profile.poses_made?.length || 0}</p>
          
          <button onClick={toggleEditMode} className="edit-button">
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
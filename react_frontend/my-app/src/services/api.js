// src/services/api.js
import { useAuth0 } from '@auth0/auth0-react';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Custom hook to use the API with Auth0 authentication
export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const getAuthHeaders = async () => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated');
    }
    
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // User API endpoints
  const userApi = {
    // Get current user profile
    getProfile: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    
    // Update user profile
    updateProfile: async (data) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    
    // Get user's friends
    getFriends: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me/friends`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      return response.json();
    },
    
    // Add a friend
    addFriend: async (friendUserId) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me/friends`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ friendUserId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add friend');
      }
      
      return response.json();
    },
    
    // Get user's notifications
    getNotifications: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me/notifications`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      return response.json();
    },
    
    // Mark notification as read
    markNotificationAsRead: async (notificationId) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/users/me/notifications/${notificationId}`, {
        method: 'PUT',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    }
  };
  
  // Pose API endpoints
  const poseApi = {
    // Get all public poses
    getAllPoses: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch poses');
      }
      
      return response.json();
    },
    
    // Get specific pose
    getPose: async (poseId) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses/${poseId}`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pose');
      }
      
      return response.json();
    },
    
    // Create new pose
    createPose: async (poseData) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(poseData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create pose');
      }
      
      return response.json();
    },
    
    // Complete a pose
    completePose: async (poseId) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses/${poseId}/complete`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete pose');
      }
      
      return response.json();
    },
    
    // Get user's created poses
    getCreatedPoses: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses/user/created`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch created poses');
      }
      
      return response.json();
    },
    
    // Get user's completed poses
    getCompletedPoses: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/poses/user/completed`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch completed poses');
      }
      
      return response.json();
    }
  };
  
  return { userApi, poseApi };
};
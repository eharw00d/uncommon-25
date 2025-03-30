import React, { useState, useEffect } from 'react';
import { useApi } from '../../services/api';
import './Friendbar.css';
import { useAuth0 } from '@auth0/auth0-react';

const Friendbar = () => {
    const { getAccessTokenSilently, user } = useAuth0();
  const { userApi } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  useEffect(() => {
    // Only fetch once
    if (hasFetched) return;
    
    const fetchFriends = async () => {
      try {
        const data = await userApi.getFriends();
        setFriends(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setFriends([]);
      } finally {
        setHasFetched(true);
      }
    };
    
    fetchFriends();
  }, [userApi, hasFetched]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle empty or malformed data safely
  const safeFilteredFriends = () => {
    if (!Array.isArray(friends)) return [];
    
    return friends.filter(friend => {
      if (!friend || !friend.user_id || typeof friend.user_id.name !== 'string') return false;
      return friend.user_id.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };
  
  const filteredFriends = safeFilteredFriends();
  
  const handleBump = (friend) => {
    setSelectedFriend(friend);
    setShowPopup(true);
  };
  
  const handlePopupAction = async (action) => {
    if (!selectedFriend) return;
    
    if (action === 'draw') {
      console.log('Draw selected for friend:', selectedFriend?.user_id?.name);
      // Implement the draw functionality here
    } else if (action === 'random') {
        try {
          // Get the friend's user ID
          const friendUserId = selectedFriend.user_id._id;
          
          // Use the existing endpoint to post to friend
          const response = await fetch('http://localhost:8000/api/users/me/bump-friend', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAccessTokenSilently()}`
            },
            body: JSON.stringify({
              friendUserId: friendUserId
            })
          });
          
          if (response.ok) {
            alert(`You bumped ${selectedFriend.user_id.name}! They will be notified.`);
          } else {
            console.error('API response status:', response.status);
            alert('Failed to send bump notification. Please try again.');
          }
        } catch (error) {
          console.error('Error in bump process:', error);
          alert('Something went wrong. Please try again.');
        }
      }
    
    // Close the popup after action
    setShowPopup(false);
  };
  
  return (
    <div className='Friendbar-container'>
      <div className="friendbar-title">
        Friends
      </div>
      
      <div className='search-container'>
        <input 
          type="text" 
          placeholder="Search friends..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="friend-search"
        />
      </div>
      
      <div className='friends-list'>
        {!hasFetched ? (
          <div className="empty-message">Loading...</div>
        ) : filteredFriends.length === 0 ? (
          <div className="empty-message">No friends found</div>
        ) : (
          filteredFriends.map(friend => (
            <div className='Friend' key={friend.user_id._id || 'unknown'}>
              <div className="friend-name">
                {friend.user_id.name}
              </div>
              <div className="friend-bump">
                <button onClick={() => handleBump(friend)}>bump</button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Popup for bump actions */}
      {showPopup && selectedFriend && (
        <div className="bump-popup">
          <div className="bump-popup-content">
            <div className="bump-popup-title">
              Bump {selectedFriend.user_id.name}
            </div>
            <div className="bump-popup-actions">
              <button 
                onClick={() => handlePopupAction('draw')}
                className="bump-action-button draw-button"
              >
                Draw
              </button>
              <button 
                onClick={() => handlePopupAction('random')}
                className="bump-action-button random-button"
              >
                Random
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friendbar;
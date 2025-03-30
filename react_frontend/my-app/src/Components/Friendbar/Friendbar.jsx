import React, { useState, useEffect } from 'react';
import { useApi } from '../../services/api';
import './Friendbar.css';

const Friendbar = () => {
  const { userApi } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  useEffect(() => {
    // Only fetch once
    if (hasFetched) return;
    
    const fetchData = async () => {
      try {
        // Fetch current user for their name
        const userData = await userApi.getProfile();
        setCurrentUser(userData);
        
        // Fetch friends
        const friendsData = await userApi.getFriends();
        setFriends(Array.isArray(friendsData) ? friendsData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setFriends([]);
      } finally {
        setHasFetched(true);
      }
    };
    
    fetchData();
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
    if (!selectedFriend || !currentUser) return;
    
    if (action === 'draw') {
      console.log('Draw selected for friend:', selectedFriend?.user_id?.name);
      // Implement the draw functionality here
    } else if (action === 'random') {
      console.log('Random selected for friend:', selectedFriend?.user_id?.name);
      
      try {
        // Use the current user's real name instead of Auth0 ID
        const userName = currentUser.name;
        
        // Create a notification for the friend
        const notification = {
          type: 'bump',
          user_id: selectedFriend.user_id._id,
          message: `${userName} bumped you!`,
          read: false
        };
        
        // For real implementation, you would send this to your API
        // await userApi.createNotification(notification);
        
        // For the purpose of this demo, we'll dispatch a custom event to update the notifications component
        const newNotificationEvent = new CustomEvent('newNotification', {
          detail: { notification }
        });
        window.dispatchEvent(newNotificationEvent);
        
        // Also show confirmation to the current user
        alert(`You bumped ${selectedFriend.user_id.name}!`);
      } catch (error) {
        console.error('Error creating notification:', error);
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
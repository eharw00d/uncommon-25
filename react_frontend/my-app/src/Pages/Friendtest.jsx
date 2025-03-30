import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';

const SimpleFriendAdd = () => {
  const { userApi } = useApi();
  const [userId, setUserId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    // Get current user ID
    const getUserId = async () => {
      try {
        const profile = await userApi.getProfile();
        setUserId(profile._id);
      } catch (err) {
        console.error(err);
      }
    };
    getUserId();
  }, [userApi]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      await userApi.addFriend(friendId);
      setResult('Friend added successfully!');
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Add Friends here!</h2>
      <div>
        <h3>Your User ID (share this with friends):</h3>
        <p>{userId || 'Loading...'}</p>
      </div>

      <form onSubmit={handleAddFriend}>
        <div>
          <label>
            Friend ID:
            <input
              type="text"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              style={{ margin: '0 10px', padding: '5px' }}
            />
          </label>
          <button type="submit">Add Friend</button>
        </div>
      </form>

      {result && <p>{result}</p>}
    </div>
  );
};

export default SimpleFriendAdd;
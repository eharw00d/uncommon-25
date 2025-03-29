import React, { useState } from 'react'
import './Friendbar.css'

const Friendbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample friends data (you would typically fetch this or pass it as props)
  const sampleFriends = [
    { id: 1, name: "Eric Harwood" },
    { id: 2, name: "Red Atagi" },
    { id: 3, name: "Jamie Shiao" },
    // Add more friends as needed
  ];
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter friends based on search term
  const filteredFriends = sampleFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='Friendbar-container'>
        <div className="friendbar-title">
            Friends
        </div>
      <div className='search-container'>
        <input 
          type="text" 
          placeholder="Search new friend..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="friend-search"
        />
      </div>
      <div className='friends-list'>
        {filteredFriends.map(friend => (
          <div className='Friend' key={friend.id}>
            <div className="friend-name">
              {friend.name}
            </div>
            <div className="friend-bump">
              <button>bump</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Friendbar
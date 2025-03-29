import React, { useState, useEffect } from 'react';
import './Notifications.css';

const Notifications = () => {

  return (
    <div className="timer-container">
        <div className="timer-title">
            Notifications
        </div>
      <div className="minutes-selector">
        <label htmlFor="minutes">Minutes:</label>
        <input
          id="minutes"
          type="number"
          min="1"
          max="60"
          className="minutes-input"
        />
      </div>
      <div className="timer-display">
      </div>
      <div className="timer-controls">
      </div>
    </div>
  );
};

export default Notifications;
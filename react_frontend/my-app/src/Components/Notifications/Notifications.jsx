import React, { useState, useEffect } from 'react';
import './Notifications.css';

const Notifications = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (timeLeft === 0 && !isActive) {
      // Initialize with selected minutes when starting from zero
      setTimeLeft(selectedMinutes * 60);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
  };

  const handleMinutesChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setSelectedMinutes(value);
    if (!isActive) {
      setTimeLeft(value * 60);
    }
  };

  return (
    <div className="timer-container">
        <div className="timer-title">
            New pose in...
        </div>
      <div className="minutes-selector">
        <label htmlFor="minutes">Minutes:</label>
        <input
          id="minutes"
          type="number"
          min="1"
          max="60"
          value={selectedMinutes}
          onChange={handleMinutesChange}
          disabled={isActive}
          className="minutes-input"
        />
      </div>
      <div className="timer-display">
        {formatTime()}
      </div>
      <div className="timer-controls">
        {!isActive ? (
          <button 
            onClick={handleStart} 
            className="button start-button"
          >
            Start
          </button>
        ) : (
          <button 
            onClick={handlePause}
            className="button pause-button"
          >
            Pause
          </button>
        )}
        <button 
          onClick={handleReset}
          className="button reset-button"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Notifications;
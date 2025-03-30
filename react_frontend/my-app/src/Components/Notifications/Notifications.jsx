import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../services/api';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { userApi } = useApi();
  const [notifications, setNotifications] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch notifications from API
  useEffect(() => {
    if (hasFetched) return;

    const fetchNotifications = async () => {
      try {
        const data = await userApi.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      } finally {
        setHasFetched(true);
      }
    };

    fetchNotifications();
  }, [userApi, hasFetched]);

  // Listen for new notifications
  useEffect(() => {
    // Function to handle new notification events
    const handleNewNotification = (event) => {
      if (event.detail && event.detail.notification) {
        setNotifications(prevNotifications => [event.detail.notification, ...prevNotifications]);
      }
    };

    // Add event listener
    window.addEventListener('newNotification', handleNewNotification);

    // Clean up
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  const handleDoPose = (notification) => {
    console.log('User clicked to do pose', notification);
    // Add your navigation or action logic here
    navigate('/camera');
  };

  return (
    <div className="notifications-container">
      <div className="notifications-title">
        Notifications
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">No notifications</div>
        ) : (
          notifications.map((notification, index) => (
            <div key={notification._id || index} className="notification-item">
              <div className="notification-message">
                {notification.message}
              </div>
              {notification.type === 'bump' && (
                <button 
                  className="do-pose-button"
                  onClick={() => handleDoPose(notification)}
                >
                  do pose
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
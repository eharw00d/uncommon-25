import React, { useState, useEffect } from 'react';
import './CSS/Camera.css'

const VideoFeed = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const serverUrl = "http://localhost:8080";
  const videoUrl = `${serverUrl}/video_feed`;

  // Check if the video stream is available
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Use the status endpoint instead of root
        const response = await fetch(`${serverUrl}/status`, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setIsConnected(true);
          setErrorMessage('');
        } else {
          throw new Error(`Server responded with status ${response.status}`);
        }
      } catch (error) {
        console.error("Connection error:", error);
        setIsConnected(false);
        setErrorMessage(`${error.message}. Make sure your Flask server is running at ${serverUrl}`);
        
        // Retry connection with exponential backoff
        if (retryCount < 5) {
          const timeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * Math.pow(1.5, retryCount));
          
          return () => clearTimeout(timeout);
        }
      }
    };

    checkConnection();
  }, [retryCount, serverUrl]);

  // Handle the image load errors
  const handleImageError = () => {
    setIsConnected(false);
    setErrorMessage(`Unable to load video feed from ${videoUrl}`);
  };

  return (
    <div className="video-container" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Live Pose Detection</h1>
      
      {isConnected ? (
        <div>
          <img
            src={videoUrl}
            alt="Pose Detection Video Feed"
            onError={handleImageError}
            style={{ 
              width: '80%', 
              maxWidth: '2000px', 
              border: '2px solid #333',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          />
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Stand in front of the camera to detect your pose.
          </p>
        </div>
      ) : (
        <div style={{ padding: '40px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Connecting to video server...</h2>
          <p>
            {retryCount >= 5 
              ? "Maximum connection attempts reached."
              : `Attempting to connect (try ${retryCount + 1}/5)...`}
          </p>
          <p style={{ color: 'red' }}>{errorMessage}</p>
          <div style={{ marginTop: '20px', textAlign: 'left', background: '#eee', padding: '15px', borderRadius: '5px' }}>
            <h3>Troubleshooting Steps:</h3>
            <ol>
              <li>Make sure your Flask server is running with: <code>python app.py</code></li>
              <li>Check that Flask is running on port 8080</li>
              <li>Verify that your webcam is connected and accessible</li>
              <li>Check for any errors in your Flask server console</li>
              <li>Try refreshing this page</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
import React, { useEffect, useRef, useState } from 'react';
import './CSS/Camera.css';

const VideoFeed = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const serverUrl = "http://localhost:8080";
  const videoUrl = `${serverUrl}/video_feed`;

  useEffect(() => {
    const checkConnection = async () => {
      try {
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

        if (retryCount < 5) {
          const timeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * Math.pow(1.5, retryCount));

          return () => clearTimeout(timeout);
        }
      }
    };

    checkConnection();
  }, [retryCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelArray = Array.from(imageData.data);
        console.log(pixelArray); // ✅ pixel array for each frame
      } catch (err) {
        console.warn('getImageData failed (possibly CORS issue)', err);
      }
    }, 100); // every 100ms (≈10fps)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="video-container" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Live Pose Detection</h1>

      {isConnected ? (
        <div>
          <img
            ref={imgRef}
            src={videoUrl}
            alt="Pose Detection Feed"
            crossOrigin="anonymous"
            onError={() => {
              setIsConnected(false);
              setErrorMessage(`Unable to load video feed from ${videoUrl}`);
            }}
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              border: '2px solid #333',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              maxWidth: '100%',
            }}
          />
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Pixel data from each frame is being logged to the console.
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
              <li>Make sure your Flask server is running: <code>python app.py</code></li>
              <li>Ensure Flask is on port <code>8080</code></li>
              <li>Verify your webcam is accessible</li>
              <li>Check the Flask console for errors</li>
              <li>Try refreshing this page</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;

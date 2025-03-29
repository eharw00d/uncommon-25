import React, { useState, useEffect, useRef } from 'react';

const Camera = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if backend is running
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:3005/status');
        if (response.ok) {
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
          setError('Backend API is not responding correctly');
        }
      } catch (err) {
        setIsConnected(false);
        setError('Could not connect to the backend API. Make sure it is running.');
      }
    };
    
    checkBackendStatus();
    // Poll the backend status every 5 seconds
    const interval = setInterval(checkBackendStatus, 3005);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MoveNet Pose Detection</h1>
      
      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
          <p className="text-sm">
            Make sure you have started the Python backend server with: 
            <code className="bg-gray-200 px-2 py-1 rounded">python backend_api.py</code>
          </p>
        </div>
      )}
      
      {isConnected ? (
        <div className="relative w-full border-4 border-gray-300 rounded-lg overflow-hidden">
          {/* Using an img tag with src set to the video feed endpoint */}
          <img 
            src="http://localhost:3005/video_feed" 
            alt="MoveNet Pose Detection" 
            className="w-full"
          />
          <div className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Connected
          </div>
        </div>
      ) : (
        <div className="bg-gray-200 w-full h-80 flex items-center justify-center rounded-lg">
          <p className="text-gray-600">Waiting for camera feed...</p>
        </div>
      )}
      
      <div className="mt-4 text-gray-700">
        <p>Press the 'q' key in the terminal window running the Python script to exit.</p>
      </div>
    </div>
  );
};

export default Camera;
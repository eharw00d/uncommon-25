import React, { useState, useEffect } from 'react';
import './ScoreBoard.css';

const ScoreBoard = ({ isGameOver }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [maxPossible, setMaxPossible] = useState(0);
  const [boxesLit, setBoxesLit] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [highScores, setHighScores] = useState([
    { name: "Amanda Murphy", score: 380 },
    { name: "Red Atagi", score: 340 },
    { name: "Jamie Shiao", score: 290 }
  ]);
  const [finalScore, setFinalScore] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  
  // Correct server URL to match your Flask server
  const serverUrl = "http://localhost:3003";
  
  // Function to fetch scores from backend
  const fetchScore = async () => {
    // IMMEDIATELY exit if game is over and we already have a final score
    if (isGameOver && finalScore > 0) {
      return; // Don't fetch again once we have a final score
    }
    
    try {
      setFetchError(null);
      const response = await fetch(`${serverUrl}/get_score`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Game is still active - update current score
      if (!isGameOver) {
        setCurrentScore(data.score);
        setMaxPossible(data.max_possible);
        setBoxesLit(data.boxes_lit);
        setTotalBoxes(data.total_boxes);
      } 
      // Game just ended - freeze the final score, never update it again
      else if (isGameOver && finalScore === 0) {
        console.log('Game over! Freezing final score at:', data.score);
        setFinalScore(data.score);
        // Update the display values one last time
        setCurrentScore(data.score);
        setMaxPossible(data.max_possible);
        setBoxesLit(data.boxes_lit);
        setTotalBoxes(data.total_boxes);
      }
    } catch (error) {
      console.error('Failed to fetch score:', error);
      setFetchError(error.message);
    }
  };
  
  // Fetch score periodically, but ONLY if the game is NOT over
  useEffect(() => {
    // If game is already over, don't set up polling at all
    if (isGameOver) {
      return;
    }
    
    // Initial fetch
    fetchScore();
    
    // Set up the interval for periodic fetching (only if game is active)
    const intervalId = setInterval(fetchScore, 500); // Update every 500ms
    
    // Cleanup function to clear the interval when component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [isGameOver]); // Re-run effect if game state changes
  
  // One-time effect to capture final score when game first ends
  useEffect(() => {
    if (isGameOver && finalScore === 0) {
      // Fetch one final time to get the final score
      fetchScore();
      
      // Set final score from current score if fetch fails
      const timeoutId = setTimeout(() => {
        if (finalScore === 0) {
          setFinalScore(currentScore);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isGameOver, finalScore, currentScore]);
  
  return (
    <div className="score-board">
      {/* Current Score Section */}
      <div className="score-section current-score">
        <h2>{isGameOver ? "Final Score" : "Current Score"}</h2>
        <div className="score-display">
          <div className={`main-score ${isGameOver ? "highlight" : ""}`}>
            {isGameOver ? finalScore || currentScore : currentScore}
          </div>
          <div className="score-details">
            <span>Max: {maxPossible}</span>
            <span>Boxes: {boxesLit}/{totalBoxes}</span>
          </div>
        </div>
        
        {/* Progress bar for boxes lit */}
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(boxesLit / (totalBoxes || 1)) * 100}%` }}
          ></div>
        </div>
        
        {/* Show error message if fetch fails */}
        {fetchError && (
          <div className="error-message">
            <p>Error fetching score: {fetchError}</p>
            <p>Make sure the Flask server is running at {serverUrl}</p>
          </div>
        )}
      </div>
      
      {/* High Scores Section */}
      <div className="score-section high-scores">
        <h2>High Scores</h2>
        <ul>
          {highScores.map((entry, index) => (
            <li key={index}>
              <span className="rank">{index + 1}.</span>
              <span className="name">{entry.name}</span>
              <span className="score">{entry.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScoreBoard;
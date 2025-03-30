import React, { useState, useEffect } from 'react';
import './ScoreBoard.css';

const ScoreBoard = ({ isGameOver }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [maxPossible, setMaxPossible] = useState(0);
  const [boxesLit, setBoxesLit] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [highScores, setHighScores] = useState([
    { name: "Player 1", score: 380 },
    { name: "Player 2", score: 340 },
    { name: "Player 3", score: 290 }
  ]);
  const [finalScore, setFinalScore] = useState(0);
  
  // Function to fetch scores from backend
  const fetchScore = async () => {
    try {
      const response = await fetch('http://localhost:8080/get_score');
      const data = await response.json();
      
      // Only update score if game is still active
      if (!isGameOver) {
        setCurrentScore(data.score);
        setMaxPossible(data.max_possible);
        setBoxesLit(data.boxes_lit);
        setTotalBoxes(data.total_boxes);
      } 
      // If game just ended, capture the final score once
      else if (isGameOver && finalScore === 0) {
        setFinalScore(data.score);
        // Also keep the last captured current values
        setCurrentScore(data.score);
        setMaxPossible(data.max_possible);
        setBoxesLit(data.boxes_lit);
        setTotalBoxes(data.total_boxes);
      }
    } catch (error) {
      console.error('Failed to fetch score:', error);
    }
  };
  
  // Fetch score periodically, but stop fetching new scores when game ends
  useEffect(() => {
    // If game is over and we have a final score, don't set up interval
    if (isGameOver && finalScore > 0) {
      return;
    }
    
    const intervalId = setInterval(fetchScore, 500); // Update every 500ms
    
    // If game just ended, fetch one final time to get the final score
    if (isGameOver) {
      fetchScore();
    }
    
    return () => clearInterval(intervalId);
  }, [isGameOver, finalScore]);
  
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
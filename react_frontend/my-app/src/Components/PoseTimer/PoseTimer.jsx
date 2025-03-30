import React, { useState, useEffect } from 'react';
import './PoseTimer.css'; // ✅ relative path, same folder


const PoseTimer = ({ onComplete }) => {
  const [phase, setPhase] = useState('prep'); // 'prep' | 'countdown' | 'done'
  const [timeLeft, setTimeLeft] = useState(3); // 3 seconds prep, then 10

  useEffect(() => {
    let interval = null;

    if (phase === 'prep' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'prep' && timeLeft === 0) {
      setPhase('countdown');
      setTimeLeft(10);
    } else if (phase === 'countdown' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'countdown' && timeLeft === 0) {
      setPhase('done');
      if (onComplete) onComplete();
    }

    return () => clearInterval(interval);
  }, [phase, timeLeft, onComplete]);

  const getMessage = () => {
    if (phase === 'prep') return 'Get ready...';
    if (phase === 'countdown') return 'Pose active!';
    if (phase === 'done') return "You're done!";
  };

  return (
    <div className="pose-timer">
      <div className="pose-title">Pose Timer</div>
      <div className="pose-message">{getMessage()}</div>
      {phase !== 'done' && <div className="pose-time">{timeLeft}</div>}
    </div>
  );  
};

export default PoseTimer;

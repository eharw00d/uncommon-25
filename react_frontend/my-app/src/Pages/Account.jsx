import React from 'react'
import './CSS/Account.css';
import Friendbar from '../Components/Friendbar/Friendbar';
import { Link } from 'react-router-dom';
import Timer from '../Components/Timer/Timer';
import NavBar from '../Components/NavBar/NavBar';
import Notifications from '../Components/Notifications/Notifications';
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useRef } from "react";
import { useApi } from '../services/api';

const Account = () => {
    const { userApi } = useApi();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shrimpDetection, setShrimpDetection] = useState(false);
    const [isShrimp, setIsShrimp] = useState(false);
    const [videoFeed, setVideoFeed] = useState(null);
    const shrimpCheckIntervalRef = useRef(null);
    const { isAuthenticated } = useAuth0();
    
    // Fetch user profile from backend when component mounts
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await userApi.getProfile();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (isAuthenticated) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [userApi, isAuthenticated]);
    
    // Fetch score data from Flask backend for shrimp detection
    useEffect(() => {
        if (shrimpDetection) {
            // Start fetching video feed
            setVideoFeed('http://localhost:3003/video_feed');
            
            // Start polling the score endpoint to check for head-shoulder overlap
            shrimpCheckIntervalRef.current = setInterval(async () => {
                try {
                    const response = await fetch('http://localhost:3003/get_score');
                    const data = await response.json();
                    
                    // Check if we have a score - this means pose detection is running
                    if (data.score !== undefined) {
                        // Make another request to check if head overlaps with shoulders
                        // We'll need to modify the Flask backend to add this endpoint
                        const shrimpResponse = await fetch('http://localhost:3003/check_shrimp');
                        const shrimpData = await shrimpResponse.json();
                        
                        setIsShrimp(shrimpData.isShrimp);
                        
                        if (shrimpData.isShrimp) {
                            // Maybe play a sound or show an alert
                            console.log("SHRIMP DETECTED!");
                        }
                    }
                } catch (error) {
                    console.error('Error checking for shrimp:', error);
                }
            }, 1000); // Check every second
            
        } else {
            // Stop the video feed and interval
            setVideoFeed(null);
            if (shrimpCheckIntervalRef.current) {
                clearInterval(shrimpCheckIntervalRef.current);
                shrimpCheckIntervalRef.current = null;
            }
            setIsShrimp(false);
        }
        
        // Cleanup function to clear interval when component unmounts
        return () => {
            if (shrimpCheckIntervalRef.current) {
                clearInterval(shrimpCheckIntervalRef.current);
            }
        };
    }, [shrimpDetection]);
    
    const toggleShrimpDetection = () => {
        setShrimpDetection(prevState => !prevState);
    };
    
    return (
        <div className='account-main'>
            <div className='friends-bar'>
                <div className="single-friend">
                    <Friendbar/>
                </div>
            </div>
            <div className="middle-title">
                <div className="welcome-msg">
                {loading ? (
                    <div className="welcome-txt">Loading...</div>
                ) : isAuthenticated && profile ? (
                    <div className="welcome-txt">Welcome, {profile.name}.</div>
                ) : (
                    <div className="welcome-txt">Welcome, stranger.</div>
                )}
                </div>
                <div className="middle-text">
                    Strike a Pose! 
                </div>
                <div className="generate-button">
                    <Link to='/camera'><button>give me a pose</button></Link>
                </div>
                <div className="create-pose-button">
                    <Link to='/create'><button>create a pose</button></Link>
                </div>
            </div>
            <div className="right-bar">
                <Timer/>
                <Notifications/>
                {/* Shrimp Detection Toggle Button */}
                <button 
                    className={`toggle-button ${shrimpDetection ? 'active' : ''} ${isShrimp ? 'shrimp-detected' : ''}`}
                    onClick={toggleShrimpDetection}
                >
                    {shrimpDetection 
                        ? (isShrimp ? '🍤 SHRIMP DETECTED! 🍤' : 'Shrimp Detection: ON') 
                        : 'Shrimp Detection: OFF'}
                </button>
                
                {/* Video Feed Display (conditionally rendered) */}
                {shrimpDetection && (
                    <div className="video-feed-container">
                        <h3>Shrimp Detector</h3>
                        {videoFeed && (
                            <img 
                                src={videoFeed} 
                                alt="Pose Detection Feed" 
                                className="video-feed"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Account
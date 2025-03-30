import React from 'react'
import './CSS/Account.css';
import Friendbar from '../Components/Friendbar/Friendbar';
import { Link } from 'react-router-dom';
import Timer from '../Components/Timer/Timer';
import NavBar from '../Components/NavBar/NavBar';
import Notifications from '../Components/Notifications/Notifications';
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useApi } from '../services/api';

const Account = () => {
    const { userApi } = useApi();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
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
                <button className='pose-button'>browse pose library</button>
                <Notifications/>
            </div>
        </div>
    )
}

export default Account
import React from 'react'
import './CSS/Account.css';
import Friendbar from '../Components/Friendbar/Friendbar';
import { Link } from 'react-router-dom';
import Timer from '../Components/Timer/Timer';
import NavBar from '../Components/NavBar/NavBar';
import Notifications from '../Components/Notifications/Notifications';
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

const Account = () => {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  return (
    <div className='account-main'>
        <div className='friends-bar'>
            <div className="single-friend">
                <Friendbar/>
            </div>
        </div>
        <div className="middle-title">
            <div className="welcome-msg">
            {isAuthenticated ? (
                <div className="welcome-txt">Welcome, {user.name}.</div>
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
import React from 'react'
import './CSS/Account.css';
import Friendbar from '../Components/Friendbar/Friendbar';
import { Link } from 'react-router-dom';
import Timer from '../Components/Timer/Timer';

const Account = () => {
  return (
    <div className='account-main'>
        <div className='friends-bar'>
            <div className="single-friend">
                <Friendbar/>
            </div>
        </div>
        <div className="middle-title">
            <div className="middle-text">
                Strike a Pose!
            </div>
            <div className="generate-button">
                <Link to='/camera'><button>give me a pose</button></Link>
            </div>
            <div className="create-pose-button">
                <button>create a pose</button>
            </div>
        </div>
        <div className="right-bar">
            <Timer/>
        </div>
    </div>
  )
}

export default Account
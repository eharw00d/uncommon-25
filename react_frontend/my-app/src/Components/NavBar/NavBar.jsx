import React from 'react'
import { Link } from 'react-router-dom';
import './NavBar.css'

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="navbar-title">
        <Link to='/'><span>_Pixel</span>pose</Link>
      </div>
      <div className="login-link">
        <Link to="/login"><button>Login</button></Link>
      </div>
    </div>
  )
}

export default NavBar
import React from 'react'
import { Link } from 'react-router-dom';
import './NavBar.css'
import { useAuth0 } from "@auth0/auth0-react";

const NavBar = () => {
    const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  return (
    <div className="navbar">
      <div className="navbar-title">
        <Link to='/'><span>_Pixel</span>pose</Link>
      </div>
      <div className="login-link">
        {isAuthenticated ? (
          <button onClick={() => logout({ returnTo: window.location.origin })}>Logout</button>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </div>
  )
}

export default NavBar
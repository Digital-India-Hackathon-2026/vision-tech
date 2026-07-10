import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">G</div>
          <span>GitHire AI</span>
        </Link>
        <div className="navbar-links">
          <a href="/#features">Features</a>
          <a href="/#how-it-works">About</a>
          <a href="/#contact">Contact</a>
          <Link to="/recruiter" className="btn-recruiter">Recruiter Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
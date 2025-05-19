import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f2f2f2',
      }}
    >
      <div>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Cloths Store</h2>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>
          Cart
        </Link>
        <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
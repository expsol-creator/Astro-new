import React from 'react';
import { FaSearch, FaChevronDown } from 'react-icons/fa'; // Using react-icons for icons

const Header = () => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: 'white',
      width: '100%',
      borderBottom: '1px solid #eaeaea'
    }}>
      {/* Logo */}
      <div style={{
        width: '50px',
        height: '30px',
        backgroundColor: '#e0e0e0',
        marginRight: '15px'
      }}></div>
      
      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '20px',
        padding: '5px 15px',
        marginRight: '20px'
      }}>
        <FaSearch style={{ color: '#666', marginRight: '8px' }} />
        <input 
          type="text" 
          placeholder="Search" 
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '14px'
          }} 
        />
      </div>
      
      {/* Navigation Links */}
      <nav style={{ marginRight: 'auto' }}>
        <ul style={{
          display: 'flex',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          gap: '30px'
        }}>
          <li><a href="#" style={{ textDecoration: 'none', color: '#333' }}>Calculator</a></li>
          <li><a href="#" style={{ textDecoration: 'none', color: '#333' }}>Services</a></li>
          <li><a href="#" style={{ textDecoration: 'none', color: '#333' }}>Shop</a></li>
          <li><a href="#" style={{ textDecoration: 'none', color: '#333' }}>Connect</a></li>
        </ul>
      </nav>
      
      {/* Register Button */}
      <button style={{
        backgroundColor: 'white',
        color: '#4285F4',
        border: '2px solid #4285F4',
        borderRadius: '25px',
        padding: '8px 25px',
        marginRight: '15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        Register
      </button>
      
      {/* Language Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer'
      }}>
        <span>EN</span>
        <FaChevronDown style={{ fontSize: '12px', marginLeft: '5px', color: '#666' }} />
      </div>
    </header>
  );
};

export default Header;

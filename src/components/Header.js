import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell'; // Update the path if needed

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="border-b border-gray-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="text-2xl md:text-4xl font-bold text-blue-700 leading-tight">
            RIDGEWOOD
            <br />
            EXCHANGE
          </div>

          {/* Desktop Navigation with Notification Bell */}
          <div className="hidden md:flex items-center">
            <nav className="flex space-x-6 text-blue-700 text-sm font-medium mr-4">
              <Link to="/" className="hover:underline">HOME</Link>
              <Link to="/about" className="hover:underline">ABOUT</Link>
              <Link to="/post" className="hover:underline">POST</Link>
              <Link to="/communityfeed" className="hover:underline">COMMUNITY FEED</Link>
            </nav>
            
            {/* Notification Bell - Desktop */}
            <NotificationBell />
          </div>

          {/* Mobile Menu Button and Notification Bell */}
          <div className="md:hidden flex items-center">
            {/* Notification Bell - Mobile */}
            <div className="mr-2">
              <NotificationBell />
            </div>
            
            <button 
              className="text-blue-700"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 flex flex-col space-y-4 text-blue-700 text-sm font-medium">
            <Link to="/" className="hover:underline" onClick={() => setIsMenuOpen(false)}>HOME</Link>
            <Link to="/about" className="hover:underline" onClick={() => setIsMenuOpen(false)}>ABOUT</Link>
            <Link to="/post" className="hover:underline" onClick={() => setIsMenuOpen(false)}>POST</Link>
            <Link to="/communityfeed" className="hover:underline" onClick={() => setIsMenuOpen(false)}>COMMUNITY FEED</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

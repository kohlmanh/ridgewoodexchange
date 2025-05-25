import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          <p>&copy; {currentYear} Ridgewood Exchange. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link to="/about" className="text-blue-600 hover:underline">About</Link>
            <span className="text-gray-400">•</span>
            <a 
              href="mailto:ridgewoodexchange@protonmail.com" 
              className="text-blue-600 hover:underline"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
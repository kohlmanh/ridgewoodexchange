import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserPosts } from '../utils/AppStorage';


const PersistentPostsAccess = () => {
  const { hasPosts } = useUserPosts();

  // Only show the component if the user has created posts
  if (!hasPosts) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        to="/my-posts"
        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
          />
        </svg>
        My Posts
      </Link>
    </div>
  );
};

export default PersistentPostsAccess;
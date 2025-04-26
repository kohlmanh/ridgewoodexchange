import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen px-4 sm:px-8 py-12 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-6xl font-bold text-center text-blue-600 mb-16">About</h1>
        
        {/* Main Content - Single paragraph with combined messaging */}
        <p className="text-xl leading-relaxed text-blue-600 mb-16">
          We launched in early 2025 with a simple idea: what if our neighborhood had its own 
          marketplace where money wasn't necessary? Ridgewood Exchange is our attempt at 
          creating this space; a community trading hub that supports the exchange of skills and 
          resources to unlock the value already present in our community and it's members.
        </p>
        
        {/* Additional Information */}
        <p className="text-xl leading-relaxed text-blue-600 mb-4">
          This site is meant to facilitate exchanges, and amplify the value we all get out of this platform.
          If you have questions, suggestions, or just want to get in touch, you can reach us at{' '}
          <a href="mailto:ridgewoodexchange@protonmail.com" className="underline hover:text-blue-800">
            ridgewoodexchange@protonmail.com
          </a>.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
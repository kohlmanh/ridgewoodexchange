import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen px-4 sm:px-8 py-4 text-blue-600" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Taglines */}
      <div className="mt-24 sm:mt-40 text-center space-y-6 sm:space-y-8 text-xl sm:text-2xl font-bold max-w-3xl mx-auto">
        <p>A local marketplace where neighbors connect, share, and trade.</p>
        <p>Exchange skills, goods, and resources.</p>
        <p>Build community, one swap at a time.</p>
      </div>

      {/* Centered button, scooted down and bigger */}
      <div className="mt-16 flex justify-center">
        <button className="border-2 border-blue-600 px-6 sm:px-8 py-3 text-base sm:text-2xl font-bold uppercase hover:bg-blue-50">
          Next Meeting: June 10th
        </button>
      </div>
    </div>
  );
};

export default HomePage;


import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
        Jersey Swap AI
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Upload a player and a jersey to see the magic happen.
      </p>
    </header>
  );
};

export default Header;

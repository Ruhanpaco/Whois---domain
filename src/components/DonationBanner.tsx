'use client';

import { useState } from 'react';
import { FaHeart, FaServer, FaGlobe, FaCode, FaDatabase, FaShieldAlt, FaRocket, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function DonationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);

  // Close the banner permanently for this session
  const closeBanner = () => {
    setIsVisible(false);
  };

  // Toggle between minimized and expanded states
  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-5 right-5 z-50 ${minimized ? 'w-auto' : 'w-full max-w-md'}`}
      >
        {minimized ? (
          // Minimized state - shows just a small button
          <motion.div 
            className="bg-gray-900 border border-green-500/30 rounded-full p-3 shadow-lg cursor-pointer flex items-center"
            onClick={toggleMinimize}
            whileHover={{ scale: 1.05 }}
          >
            <FaHeart className="text-green-500 animate-pulse" />
            <span className="ml-2 text-green-400 text-sm">Support this project</span>
          </motion.div>
        ) : (
          // Full banner state
          <div className="bg-gray-900 border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900/50 to-black p-4 flex justify-between items-center">
              <h3 className="text-green-400 font-bold flex items-center">
                <FaHeart className="mr-2 text-green-500" />
                Support Domain Intelligence Tool
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleMinimize} 
                  className="text-gray-400 hover:text-green-400 transition-colors p-1"
                  aria-label="Minimize"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
                <button 
                  onClick={closeBanner} 
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <p className="text-gray-300 text-sm mb-3">
                By donating, you're helping me improve this tool with:
              </p>
              
              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-start">
                  <FaGlobe className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">Acquiring a dedicated domain name</span>
                </li>
                <li className="flex items-start">
                  <FaServer className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">Upgrading server infrastructure for faster lookups</span>
                </li>
                <li className="flex items-start">
                  <FaDatabase className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">Premium API access for more comprehensive data</span>
                </li>
                <li className="flex items-start">
                  <FaShieldAlt className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">Enhanced security features and SSL monitoring</span>
                </li>
                <li className="flex items-start">
                  <FaCode className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-300">Developing new features and tools</span>
                </li>
              </ul>
              
              {/* Donation Buttons */}
              <div className="flex flex-col space-y-2">
                <a 
                  href="https://pay.ruhanpacolli.online/b/7sY3cu0Zj4nNbwkevgejK01" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
                >
                  <FaHeart className="mr-2" />
                  Support via Stripe
                </a>
                <a 
                  href="https://github.com/sponsors/Ruhanpaco" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors"
                >
                  <FaRocket className="mr-2" />
                  Become a GitHub Sponsor
                </a>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-black/50 p-3 text-center">
              <p className="text-gray-400 text-xs">
                Every contribution helps keep this project running and improving. Thank you! ❤️
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
} 
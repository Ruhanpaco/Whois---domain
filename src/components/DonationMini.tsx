'use client';

import { FaHeart, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function DonationMini() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-gray-900 to-black border border-green-500/30 rounded-lg overflow-hidden shadow-md"
    >
      <div className="p-4">
        <h3 className="text-green-400 text-sm font-medium flex items-center mb-2">
          <FaHeart className="mr-2 text-green-500" />
          Support this tool
        </h3>
        
        <p className="text-xs text-gray-300 mb-3">
          Your support helps us maintain and improve this free service with better infrastructure and premium data sources.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <a 
            href="https://pay.ruhanpacolli.online/b/7sY3cu0Zj4nNbwkevgejK01" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-600/20 hover:bg-green-600/40 text-green-400 py-1.5 px-3 rounded text-xs flex items-center justify-center transition-colors border border-green-500/30"
          >
            <FaHeart className="mr-1 text-xs" />
            Via Stripe
          </a>
          <a 
            href="https://github.com/sponsors/Ruhanpaco" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-800/40 hover:bg-gray-800/60 text-gray-300 py-1.5 px-3 rounded text-xs flex items-center justify-center transition-colors border border-gray-600/30"
          >
            <FaRocket className="mr-1 text-xs" />
            GitHub Sponsor
          </a>
        </div>
      </div>
    </motion.div>
  );
} 
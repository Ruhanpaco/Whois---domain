'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaGithub, FaInfoCircle, FaHome, FaRocket, FaLightbulb } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check if the link is active
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-4 sm:px-6 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-md border-b border-green-500/30' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white flex items-center group">
          <span className="text-green-500 mr-2 group-hover:animate-pulse">&lt;</span>
          <span className="glow-text">DomainInfo</span>
          <span className="text-green-500 ml-2 group-hover:animate-pulse">/&gt;</span>
          <span className="cursor-blink ml-1 text-green-500 code-font"></span>
        </Link>
        
        {/* Mobile menu button */}
        <div className="sm:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-green-400 transition-colors p-2 rounded-md border border-green-500/30 bg-black/50 hover:bg-black/70"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden sm:flex space-x-6 code-font text-sm">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-md transition-colors inline-flex items-center
              ${isActive('/') 
                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                : 'text-gray-300 hover:text-green-400 hover:bg-black/50'}`}
          >
            <FaHome className="mr-2" />
            Home
          </Link>
          
          <Link 
            href="/futures" 
            className={`px-3 py-2 rounded-md transition-colors inline-flex items-center
              ${isActive('/futures') 
                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                : 'text-gray-300 hover:text-green-400 hover:bg-black/50'}`}
          >
            <FaRocket className="mr-2" />
            Features
          </Link>
          
          <Link 
            href="/feature-requests" 
            className={`px-3 py-2 rounded-md transition-colors inline-flex items-center
              ${isActive('/feature-requests') 
                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                : 'text-gray-300 hover:text-green-400 hover:bg-black/50'}`}
          >
            <FaLightbulb className="mr-2" />
            Requests
          </Link>
          
          <Link 
            href="/about" 
            className={`px-3 py-2 rounded-md transition-colors inline-flex items-center
              ${isActive('/about') 
                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                : 'text-gray-300 hover:text-green-400 hover:bg-black/50'}`}
          >
            <FaInfoCircle className="mr-2" />
            About
          </Link>
          
          <a 
            href="https://github.com/Ruhanpaco" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-3 py-2 rounded-md text-gray-300 hover:text-green-400 hover:bg-black/50 transition-colors inline-flex items-center"
          >
            <FaGithub className="mr-2" />
            GitHub
          </a>
        </nav>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="sm:hidden mt-4 code-font absolute left-0 right-0 px-4"
        >
          <div className="flex flex-col space-y-2 px-4 py-4 bg-black/90 backdrop-blur-lg rounded-md border border-green-500/30 shadow-lg shadow-green-900/20">
            <Link 
              href="/" 
              className={`p-2 rounded transition-colors inline-flex items-center
                ${isActive('/') 
                  ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                  : 'text-gray-300 hover:text-green-400'}`}
              onClick={() => setIsOpen(false)}
            >
              <FaHome className="mr-2" />
              Home
            </Link>
            
            <Link 
              href="/futures" 
              className={`p-2 rounded transition-colors inline-flex items-center
                ${isActive('/futures') 
                  ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                  : 'text-gray-300 hover:text-green-400'}`}
              onClick={() => setIsOpen(false)}
            >
              <FaRocket className="mr-2" />
              Features
            </Link>
            
            <Link 
              href="/feature-requests" 
              className={`p-2 rounded transition-colors inline-flex items-center
                ${isActive('/feature-requests') 
                  ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                  : 'text-gray-300 hover:text-green-400'}`}
              onClick={() => setIsOpen(false)}
            >
              <FaLightbulb className="mr-2" />
              Requests
            </Link>
            
            <Link 
              href="/about" 
              className={`p-2 rounded transition-colors inline-flex items-center
                ${isActive('/about') 
                  ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                  : 'text-gray-300 hover:text-green-400'}`}
              onClick={() => setIsOpen(false)}
            >
              <FaInfoCircle className="mr-2" />
              About
            </Link>
            
            <a 
              href="https://github.com/Ruhanpaco" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded text-gray-300 hover:text-green-400 transition-colors inline-flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <FaGithub className="mr-2" />
              GitHub
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
} 
'use client';

import Link from 'next/link';
import { FaEnvelope, FaInstagram, FaGithub, FaGlobe, FaCode, FaHeart, FaRocket, FaSearch, FaTerminal, FaDatabase, FaServer, FaShieldAlt, FaDollarSign, FaStripe } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <footer className="py-10 px-4 border-t border-green-500/30 bg-black/80 mt-16 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center text-2xl font-bold text-white mb-4">
              <span className="text-green-500 mr-2">&lt;</span>
              <span className="glow-text">DomainInfo</span>
              <span className="text-green-500 ml-2">/&gt;</span>
            </div>
            <p className="text-gray-300 mb-4 text-sm">
              A powerful domain information tool providing comprehensive details about domains including WHOIS data, DNS records, and SSL information.
            </p>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://github.com/Ruhanpaco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/ruhanpacodev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a 
                href="https://ruhanpacolli.online" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
                aria-label="Website"
              >
                <FaGlobe className="h-5 w-5" />
              </a>
              <a 
                href="mailto:hi@ruhanpacolli.online" 
                className="text-gray-400 hover:text-green-400 transition-colors"
                aria-label="Email"
              >
                <FaEnvelope className="h-5 w-5" />
              </a>
            </div>
            <a 
              href="https://pay.ruhanpacolli.online/b/7sY3cu0Zj4nNbwkevgejK01" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              <FaDollarSign className="mr-1" />
              Support <span className="ml-1 text-xs opacity-80">via Stripe</span>
            </a>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1">
            <h3 className="text-green-400 font-bold mb-4 text-lg code-font flex items-center">
              <FaTerminal className="mr-2" />
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group">
                  <span className="text-green-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">$</span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/futures" className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group">
                  <span className="text-green-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">$</span>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/results" className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group">
                  <span className="text-green-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">$</span>
                  Results
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group">
                  <span className="text-green-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">$</span>
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="col-span-1">
            <h3 className="text-green-400 font-bold mb-4 text-lg code-font flex items-center">
              <FaRocket className="mr-2" />
              Features
            </h3>
            <ul className="space-y-2">
              <li>
                <div className="text-gray-300 flex items-center text-sm">
                  <FaDatabase className="text-green-500 mr-2 w-4 h-4" />
                  WHOIS Lookup
                </div>
              </li>
              <li>
                <div className="text-gray-300 flex items-center text-sm">
                  <FaServer className="text-green-500 mr-2 w-4 h-4" />
                  DNS Records
                </div>
              </li>
              <li>
                <div className="text-gray-300 flex items-center text-sm">
                  <FaShieldAlt className="text-green-500 mr-2 w-4 h-4" />
                  SSL Certificate
                </div>
              </li>
              <li>
                <div className="text-gray-300 flex items-center text-sm">
                  <FaSearch className="text-green-500 mr-2 w-4 h-4" />
                  Subdomain Discovery
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <motion.div 
            className="col-span-1"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h3 className="text-green-400 font-bold mb-4 text-lg code-font flex items-center">
              <FaEnvelope className="mr-2" />
              Contact
            </h3>
            <ul className="space-y-3">
              <motion.li variants={item}>
                <a 
                  href="mailto:hi@ruhanpacolli.online" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group"
                >
                  <code className="text-green-500 mr-2">$_EMAIL:</code>
                  hi@ruhanpacolli.online
                </a>
              </motion.li>
              <motion.li variants={item}>
                <a 
                  href="https://instagram.com/ruhanpacodev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group"
                >
                  <code className="text-green-500 mr-2">$_INSTA:</code>
                  @ruhanpacodev
                </a>
              </motion.li>
              <motion.li variants={item}>
                <a 
                  href="https://github.com/Ruhanpaco" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group"
                >
                  <code className="text-green-500 mr-2">$_GITHUB:</code>
                  @Ruhanpaco
                </a>
              </motion.li>
              <motion.li variants={item}>
                <a 
                  href="https://ruhanpacolli.online" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center text-sm group"
                >
                  <code className="text-green-500 mr-2">$_WEBSITE:</code>
                  ruhanpacolli.online
                </a>
              </motion.li>
            </ul>
          </motion.div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-green-500/20 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p className="flex items-center justify-center code-font">
            <span className="text-green-500 mr-2">$ echo</span>
            © {currentYear} DomainInfo Tool. Made with 
            <FaHeart className="mx-1 text-green-500" /> by 
            <a 
              href="https://ruhanpacolli.online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 text-green-400 hover:text-green-300"
            >
              Ruhan Pacolli
            </a>
          </p>
          <p className="mt-2 flex items-center justify-center code-font">
            <span className="text-green-500 mr-2">$ tech</span>
            Built with <FaCode className="mx-1 text-green-500" /> Next.js, Tailwind CSS & MongoDB
          </p>
        </div>
      </div>
    </footer>
  );
} 
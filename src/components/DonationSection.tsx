'use client';

import { FaHeart, FaServer, FaGlobe, FaCode, FaDatabase, FaShieldAlt, FaRocket } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function DonationSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900 to-black border border-green-500/30 rounded-lg overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-900/50 to-black p-6 border-b border-green-500/30">
            <motion.h2 variants={item} className="text-2xl font-bold text-green-400 flex items-center">
              <FaHeart className="mr-3 text-green-500" />
              Support the Domain Intelligence Tool
            </motion.h2>
            <motion.p variants={item} className="mt-2 text-gray-300">
              Help us continue to provide and improve this free tool for the community
            </motion.p>
          </div>
          
          {/* Content */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Benefits */}
            <motion.div variants={item}>
              <h3 className="text-lg font-mono text-green-400 mb-4 flex items-center">
                <span className="text-green-500 mr-2">$</span> Your support enables:
              </h3>
              
              <ul className="space-y-4">
                <motion.li variants={item} className="flex items-start">
                  <div className="bg-green-900/30 p-2 rounded-md mr-4">
                    <FaGlobe className="text-green-500 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium">Dedicated Domain</h4>
                    <p className="text-gray-400 text-sm">Help us secure a professional domain name for better accessibility</p>
                  </div>
                </motion.li>
                
                <motion.li variants={item} className="flex items-start">
                  <div className="bg-green-900/30 p-2 rounded-md mr-4">
                    <FaServer className="text-green-500 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium">Enhanced Infrastructure</h4>
                    <p className="text-gray-400 text-sm">Upgrade our servers for faster and more reliable lookups</p>
                  </div>
                </motion.li>
                
                <motion.li variants={item} className="flex items-start">
                  <div className="bg-green-900/30 p-2 rounded-md mr-4">
                    <FaDatabase className="text-green-500 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium">Premium Data Sources</h4>
                    <p className="text-gray-400 text-sm">Access to premium APIs for more comprehensive domain information</p>
                  </div>
                </motion.li>
                
                <motion.li variants={item} className="flex items-start">
                  <div className="bg-green-900/30 p-2 rounded-md mr-4">
                    <FaCode className="text-green-500 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium">New Features</h4>
                    <p className="text-gray-400 text-sm">Development of new tools and features for enhanced domain analysis</p>
                  </div>
                </motion.li>
              </ul>
            </motion.div>
            
            {/* Right column - Donation options */}
            <motion.div variants={item} className="flex flex-col justify-center">
              <div className="bg-gray-900/70 rounded-lg p-6 border border-green-500/20">
                <h3 className="text-lg font-mono text-green-400 mb-6 flex items-center">
                  <span className="text-green-500 mr-2">$</span> Support Options
                </h3>
                
                <div className="space-y-4">
                  <motion.div 
                    variants={item}
                    whileHover={{ scale: 1.02 }}
                    className="transition-all"
                  >
                    <a 
                      href="https://pay.ruhanpacolli.online/b/7sY3cu0Zj4nNbwkevgejK01" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md flex items-center justify-center transition-colors"
                    >
                      <FaHeart className="mr-2" />
                      Support via Stripe
                    </a>
                    <p className="text-xs text-gray-400 mt-2 text-center">Secure one-time payment</p>
                  </motion.div>
                  
                  <motion.div 
                    variants={item}
                    whileHover={{ scale: 1.02 }}
                    className="transition-all"
                  >
                    <a 
                      href="https://github.com/sponsors/Ruhanpaco" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-md flex items-center justify-center transition-colors"
                    >
                      <FaRocket className="mr-2" />
                      Become a GitHub Sponsor
                    </a>
                    <p className="text-xs text-gray-400 mt-2 text-center">Monthly support with perks</p>
                  </motion.div>
                  
                  <div className="border-t border-green-500/20 pt-4 mt-6">
                    <p className="text-center text-sm text-gray-300">
                      Thank you for helping keep this tool free and constantly improving
                    </p>
                    <p className="text-center text-green-400 text-sm mt-2 font-mono">
                      ~ Ruhan Pacolli
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Testimonials or stats */}
          <div className="bg-black/50 p-4 border-t border-green-500/30">
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div className="flex-1 min-w-[150px]">
                <p className="text-green-500 text-2xl font-bold">8500+</p>
                <p className="text-gray-400 text-sm">Domain Lookups</p>
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="text-green-500 text-2xl font-bold">20,000+</p>
                <p className="text-gray-400 text-sm">DNS Queries</p>
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="text-green-500 text-2xl font-bold">12,000+</p>
                <p className="text-gray-400 text-sm">SSL Checks</p>
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="text-green-500 text-2xl font-bold">100%</p>
                <p className="text-gray-400 text-sm">Open Source</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 
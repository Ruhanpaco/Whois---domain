'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FaTerminal, 
  FaServer,
  FaGlobe,
  FaShieldAlt,
  FaSitemap,
  FaEnvelope,
  FaNetworkWired,
  FaGithub,
  FaBug,
  FaChevronRight
} from 'react-icons/fa';
import DonationSection from '@/components/DonationSection';

export default function About() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-12">
        <main className="flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full mb-12 max-w-4xl"
          >
            <div className="bg-gray-900 border border-green-500/30 rounded-t-md p-2 flex items-center">
              <div className="flex items-center space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400">domain-intel-about.sh</div>
            </div>
            
            <div className="bg-gray-900/70 rounded-b-md border-x border-b border-green-500/30 p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span className="text-green-400">$</span> <span className="typing-animation">cat README.md</span>
                <div className="mt-4 pl-4">
                  <h2 className="text-2xl font-bold text-green-500 mb-4">Domain Intelligence Tool</h2>
                  <p className="text-gray-300 mb-6">
                    A comprehensive domain reconnaissance and intelligence gathering tool designed for security researchers, 
                    penetration testers, and system administrators. This tool provides detailed insights into 
                    domains, their DNS records, SSL certificates, and more.
                  </p>

                  <h3 className="text-xl text-green-500 mt-8 mb-4 flex items-center">
                    <FaTerminal className="mr-2" /> Overview
                  </h3>
                  <div className="bg-black/40 p-4 rounded-md border border-green-500/20 mb-6">
                    <p className="text-gray-300">
                      The Domain Intelligence Tool is a web-based application that allows you to gather 
                      extensive information about any domain. It aggregates data from multiple sources 
                      and presents it in an organized, easy-to-understand format, helping you assess 
                      security, verify ownership, and map out digital infrastructure.
                    </p>
                  </div>

                  <h3 className="text-xl text-green-500 mt-8 mb-4 flex items-center">
                    <FaServer className="mr-2" /> Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/40 p-4 rounded-md border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <FaGlobe className="text-green-500 mr-2" />
                        <h4 className="font-bold text-green-400">WHOIS Lookup</h4>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Retrieves domain registration information, including registrar details, creation and expiration dates, 
                        and ownership information when available.
                      </p>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-md border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <FaNetworkWired className="text-green-500 mr-2" />
                        <h4 className="font-bold text-green-400">DNS Records</h4>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Fetches and displays all relevant DNS records including A, AAAA, MX, TXT, and NS records 
                        with proper formatting and explanation.
                      </p>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-md border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <FaShieldAlt className="text-green-500 mr-2" />
                        <h4 className="font-bold text-green-400">SSL Certificate Analysis</h4>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Analyzes SSL certificates to verify validity, check expiration dates, identify 
                        issuers, and determine security status of connections.
                      </p>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-md border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <FaSitemap className="text-green-500 mr-2" />
                        <h4 className="font-bold text-green-400">Subdomain Discovery</h4>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Identifies subdomains associated with the target domain through various enumeration 
                        techniques and provides IP and SSL information for each.
                      </p>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-md border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <FaEnvelope className="text-green-500 mr-2" />
                        <h4 className="font-bold text-green-400">Email Verification</h4>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Discovers and verifies email addresses associated with the domain, validates email server 
                        configurations, and checks SPF/DMARC records.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl text-green-500 mt-8 mb-4 flex items-center">
                    <FaTerminal className="mr-2" /> How It Works
                  </h3>
                  <div className="bg-black/40 p-4 rounded-md border border-green-500/20 mb-6">
                    <ol className="space-y-4 text-gray-300">
                      <li className="flex">
                        <span className="text-green-500 mr-2">1.</span>
                        <span>Enter the target domain name in the search bar</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">2.</span>
                        <span>The backend performs parallel lookups using various APIs and services</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">3.</span>
                        <span>WHOIS data is retrieved from registrar databases</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">4.</span>
                        <span>DNS queries are executed to retrieve various record types</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">5.</span>
                        <span>SSL certificates are downloaded and analyzed for security information</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">6.</span>
                        <span>Subdomain discovery techniques are employed to map the domain&apos;s structure</span>
                      </li>
                      <li className="flex">
                        <span className="text-green-500 mr-2">7.</span>
                        <span>Results are aggregated, processed, and presented in an organized interface</span>
                      </li>
                    </ol>
                  </div>

                  <h3 className="text-xl text-green-500 mt-8 mb-4 flex items-center">
                    <FaGithub className="mr-2" /> Technical Details
                  </h3>
                  <div className="bg-black/40 p-4 rounded-md border border-green-500/20 mb-6">
                    <div className="text-sm text-gray-300">
                      <p className="mb-2">Built with:</p>
                      <ul className="space-y-1 ml-4">
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          Next.js for the frontend and API routes
                        </li>
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          React for UI components and state management
                        </li>
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          TypeScript for type safety and code quality
                        </li>
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          TailwindCSS for styling and responsive design
                        </li>
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          Framer Motion for animations and transitions
                        </li>
                        <li className="flex items-center">
                          <FaChevronRight className="text-green-500 mr-2 text-xs" />
                          Node.js libraries for DNS, WHOIS, and SSL processing
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Support/Donation Section */}
                  <DonationSection />

                  <h3 className="text-xl text-green-500 mt-8 mb-4 flex items-center">
                    <FaBug className="mr-2" /> Usage Disclaimer
                  </h3>
                  <div className="bg-black/40 p-4 rounded-md border border-green-500/20 mb-6 text-gray-300">
                    <p className="mb-2">
                      This tool is intended for legitimate security research, penetration testing with proper authorization, 
                      and system administration purposes only. Always ensure you have proper permission before scanning domains 
                      you don&apos;t own.
                    </p>
                    <p>
                      The developers of this tool accept no liability for misuse or any damages resulting from the use of this software.
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="border-t border-green-500/30 pt-4 mt-8">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div>© {new Date().getFullYear()} Domain Intelligence Tool</div>
                  <div className="flex space-x-4">
                    <Link href="/" className="hover:text-green-400 transition-colors">Home</Link>
                    <Link href="/futures" className="hover:text-green-400 transition-colors">Roadmap</Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
} 
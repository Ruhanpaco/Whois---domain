'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaSearch, FaGlobe, FaServer, FaShieldAlt, FaTerminal, FaNetworkWired, FaCode, FaLock, FaRocket, FaDatabase, FaUserSecret } from 'react-icons/fa';
import Link from 'next/link';
import StatisticsCounter from '@/components/StatisticsCounter';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateDomain = (domain: string) => {
    // Simple domain validation regex
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!domain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    if (!validateDomain(domain)) {
      setError('Please enter a valid domain name');
      return;
    }

    setIsSubmitting(true);
    // Navigate to results page with the domain as a query parameter
    router.push(`/results?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-12">
        <main className="flex flex-col items-center">
          <div className="w-full text-center mb-8">
            <h2 className="text-xl md:text-2xl text-white mb-4">Find Website Ownership Details with <span className="text-green-400">Free WHOIS Lookup</span></h2>
            <p className="text-gray-300 max-w-3xl mx-auto text-sm md:text-base">
              Get comprehensive domain registration information, DNS records, SSL certificates, and discover subdomains - all in one place.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="w-full mb-12 max-w-4xl"
          >
            <div className="bg-gray-900 border border-green-500/30 rounded-t-md p-2 flex items-center">
              <div className="flex items-center space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400">whois-lookup.sh</div>
            </div>
            
            <div className="bg-gray-900/70 rounded-b-md border-x border-b border-green-500/30 p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span className="text-green-400">$</span> <span className="typing-animation">whois-lookup --help</span>
                <div className="mt-3 pl-4 text-gray-400 text-sm space-y-1">
                  <p>WHOIS Lookup Tool v1.0.0</p>
                  <p>Get comprehensive domain information including WHOIS data, DNS records, SSL and more.</p>
                  <p>Usage: whois-lookup [options] &lt;domain&gt;</p>
                </div>
                
                <div className="mt-6">
                  <span className="text-green-400">$</span> <span className="typing-animation">whois-lookup --scan</span>
                  <form 
                    onSubmit={handleSubmit} 
                    className="mt-4 pl-4"
                    aria-label="WHOIS lookup form"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaSearch className="h-4 w-4 text-green-400/50" />
                        </div>
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          placeholder="Enter a domain name (e.g., example.com)"
                          className="block w-full pl-10 pr-3 py-3 border border-green-500/30 rounded-md bg-black/50 text-green-400 placeholder-green-400/40 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500/50 text-sm"
                          spellCheck="false"
                          autoComplete="off"
                          aria-label="Domain name for WHOIS lookup"
                        />
                        {error && (
                          <div className="absolute -bottom-6 left-0 text-red-400 text-xs">
                            Error: {error}
                          </div>
                        )}
                      </div>
                      <motion.button
                        type="submit"
                        className="px-6 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-medium rounded-md transition-colors duration-200 flex-shrink-0 flex items-center justify-center border border-green-500/50 hover:border-green-500"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        aria-label="Perform WHOIS lookup"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mr-2"></div>
                            Running...
                          </>
                        ) : (
                          <>
                            <FaTerminal className="mr-2" />
                            Lookup Domain
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>

              <div className="mt-12 mb-6 border-t border-gray-700 pt-6">
                <h3 className="text-sm text-white mb-4 font-medium">Domain Information Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/40 p-4 rounded border border-green-500/20 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaUserSecret className="text-green-500 mr-2" />
                      <h3 className="text-sm font-semibold text-green-400">WHOIS Lookup</h3>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Registrar info, registration dates, and ownership details.</p>
                    <div className="mt-2 text-xs text-green-600">--module whois</div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black/40 p-4 rounded border border-green-500/20 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaNetworkWired className="text-green-500 mr-2" />
                      <h3 className="text-sm font-semibold text-green-400">DNS Records</h3>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">A, AAAA, MX, TXT, CNAME, NS records and more.</p>
                    <div className="mt-2 text-xs text-green-600">--module dns</div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-black/40 p-4 rounded border border-green-500/20 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaLock className="text-green-500 mr-2" />
                      <h3 className="text-sm font-semibold text-green-400">SSL Certificate</h3>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Certificate details, validity, expiration and security status.</p>
                    <div className="mt-2 text-xs text-green-600">--module ssl</div>
                  </motion.div>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 bg-black/60 p-4 rounded border border-green-500/30"
              >
                <div className="flex items-center text-xs text-gray-400 mb-2">
                  <FaTerminal className="mr-2 text-green-500" />
                  <span>Example WHOIS Lookup Output</span>
                </div>
                <pre className="text-xs text-green-400 overflow-x-auto">
                  <code>
{`$ whois-lookup example.com

[+] Domain: example.com
[+] Registrar: IANA
[+] Created: 1995-08-14
[+] Expires: 2023-08-13
[+] Status: clientTransferProhibited

[+] DNS Records:
    A     93.184.216.34
    AAAA  2606:2800:220:1:248:1893:25c8:1946
    MX    0 .
    NS    a.iana-servers.net
    NS    b.iana-servers.net

[+] SSL Certificate:
    Valid: true
    Issuer: DigiCert Inc
    Expires: 2026-01-15
    Protocol: TLSv1.3`}
                  </code>
                </pre>
              </motion.div>
              
              {/* Statistics Counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <StatisticsCounter />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Benefits Section */}
          <div className="w-full max-w-4xl mb-12">
            <h2 className="text-xl text-white mb-6 font-medium">Why Use Our Free WHOIS Lookup Tool?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-green-500/20 p-4 rounded-md">
                <h3 className="text-green-400 flex items-center text-sm font-medium mb-2">
                  <FaDatabase className="mr-2" /> Comprehensive Domain Data
                </h3>
                <p className="text-gray-300 text-sm">
                  Get complete domain registration information, contact details, important dates, and registrar information - all in one place.
                </p>
              </div>
              <div className="bg-gray-900/50 border border-green-500/20 p-4 rounded-md">
                <h3 className="text-green-400 flex items-center text-sm font-medium mb-2">
                  <FaNetworkWired className="mr-2" /> Complete DNS Analysis
                </h3>
                <p className="text-gray-300 text-sm">
                  View all DNS records including A, AAAA, MX, TXT, and NS records to understand the domain's technical configuration.
                </p>
              </div>
              <div className="bg-gray-900/50 border border-green-500/20 p-4 rounded-md">
                <h3 className="text-green-400 flex items-center text-sm font-medium mb-2">
                  <FaShieldAlt className="mr-2" /> Security Verification
                </h3>
                <p className="text-gray-300 text-sm">
                  Check SSL certificate validity, expiration dates, and encryption details to assess a domain's security posture.
                </p>
              </div>
              <div className="bg-gray-900/50 border border-green-500/20 p-4 rounded-md">
                <h3 className="text-green-400 flex items-center text-sm font-medium mb-2">
                  <FaGlobe className="mr-2" /> Subdomain Discovery
                </h3>
                <p className="text-gray-300 text-sm">
                  Discover subdomains associated with the main domain to get a complete picture of the website's structure.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

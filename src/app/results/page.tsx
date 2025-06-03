'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaServer, FaGlobe, FaShieldAlt, FaTerminal, FaArrowLeft, FaCopy, FaClock, FaCalendarAlt, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaSitemap, FaLink, FaRocket, FaCode } from 'react-icons/fa';
import Link from 'next/link';

// Define interfaces for the different data types
interface WhoisData {
  domainName?: string;
  registrar?: string;
  creationDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  registrantName?: string;
  registrantOrganization?: string;
  registrantEmail?: string;
  registrantPhone?: string;
  registrantStreet?: string;
  registrantCity?: string;
  registrantState?: string;
  registrantPostalCode?: string;
  registrantCountry?: string;
  adminName?: string;
  adminOrganization?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminCountry?: string;
  techName?: string;
  techEmail?: string;
  registrarUrl?: string;
  status?: string[];
  nameServers?: string[];
}

interface DnsRecord {
  name: string;
  ttl?: number;
  value: string;
  priority?: number;
}

interface DnsData {
  a?: DnsRecord[];
  aaaa?: DnsRecord[];
  mx?: DnsRecord[];
  ns?: DnsRecord[];
  txt?: DnsRecord[];
}

interface SslData {
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  serialNumber?: string;
  protocol?: string;
  cipher?: string;
  error?: string;
}

interface EmailVerification {
  valid: boolean;
  status: string;
  message: string;
}

interface EmailAddress {
  address: string;
  status: string;
  verification: EmailVerification;
}

interface EmailData {
  domainEmails?: EmailAddress[];
  thirdPartyEmails?: EmailAddress[];
  validEmails?: EmailAddress[];
  mailServers?: {
    ttl?: number;
    priority: number;
    host: string;
  }[];
  spfRecord?: string;
  dmarcRecord?: string;
}

interface Subdomain {
  name: string;
  ip: string;
  sslInfo?: {
    valid: boolean;
    issuer: string;
    validTo: string;
    protocol: string;
    error?: string;
  };
}

// Get the email verification icon based on status
const getEmailStatusIcon = (status: string) => {
  switch (status) {
    case 'valid':
      return <FaCheckCircle className="text-green-400" title="Verified" />;
    case 'invalid':
      return <FaTimesCircle className="text-red-400" title="Invalid" />;
    default:
      return <FaQuestionCircle className="text-yellow-400" title="Unverified" />;
  }
};

// Get the email status text based on verification results
const getEmailStatusText = (verification: EmailVerification) => {
  if (!verification) return 'Unknown';
  if (verification.valid) return 'Valid';
  return verification.message || verification.status || 'Invalid';
};

// Loading component
function ResultsPageLoader() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading domain information...</p>
        </div>
      </main>
    </div>
  );
}

// Results content component
function ResultsPageContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || 'example.com';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('whois');
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [dnsData, setDnsData] = useState<DnsData | null>(null);
  const [sslData, setSslData] = useState<SslData | null>(null);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/V1/GET/domain?domain=${encodeURIComponent(domain)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch domain information');
        }
        
        const data = await response.json();
        
        console.log('SSL Data:', data.sslInfo);
        
        setWhoisData(data.whoisData || null);
        setDnsData(data.dnsRecords || null);
        setSslData(data.sslInfo || null);
        setEmailData(data.emailData || null);
        setSubdomains(data.subdomains || []);
      } catch (error) {
        console.error('Error fetching domain data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [domain]);

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'Not Available';
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not Available';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Not Available';
    }
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

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
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="bg-gray-900 border border-green-500/30 rounded-t-md p-2 flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-gray-400">domain-scan-results.sh</div>
          </div>
          
          <div className="bg-gray-900/70 rounded-b-md border-x border-b border-green-500/30 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FaCode className="mr-2 text-xl text-green-500" />
                  <h1 className="text-xl font-bold text-green-400">
                    <span className="glow-text">Domain</span> Intelligence Tool
                  </h1>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <span className="text-gray-300">whois</span> 
                  <span className="ml-2 text-green-400 truncate max-w-[200px] sm:max-w-none">{domain}</span>
                  <button
                    onClick={() => copyToClipboard(domain)}
                    className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
                    title="Copy domain"
                  >
                    <FaCopy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex mt-4 sm:mt-0 space-x-2">
                <Link 
                  href="/"
                  className="px-3 py-2 inline-flex items-center text-green-400 transition-colors text-sm border border-green-500/30 rounded hover:bg-green-900/20"
                >
                  <FaArrowLeft className="mr-2" />
                  New Search
                </Link>
                <Link 
                  href="/about"
                  className="px-3 py-2 inline-flex items-center text-green-400 transition-colors text-sm border border-green-500/30 rounded hover:bg-green-900/20"
                >
                  <FaTerminal className="mr-2" />
                  About
                </Link>
                <Link 
                  href="/futures"
                  className="px-3 py-2 inline-flex items-center text-green-400 transition-colors text-sm border border-green-500/30 rounded hover:bg-green-900/20"
                >
                  <FaRocket className="mr-2" />
                  Roadmap
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Fetching information for {domain}...</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Fetching Domain Data</h3>
            <p className="text-gray-300">{error}</p>
            <p className="mt-4 text-gray-400 text-sm">Please try again or try another domain.</p>
          </motion.div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="mb-6 bg-gray-900/70 rounded-lg border border-green-500/30 p-1 sticky top-4 z-10 shadow-lg">
              <div className="flex flex-wrap">
                <button
                  onClick={() => setActiveTab('whois')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'whois'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  }`}
                >
                  <FaServer className="mr-2" />
                  WHOIS
                </button>
                <button
                  onClick={() => setActiveTab('dns')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'dns'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  }`}
                >
                  <FaGlobe className="mr-2" />
                  DNS
                </button>
                <button
                  onClick={() => setActiveTab('ssl')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'ssl'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  }`}
                >
                  <FaShieldAlt className="mr-2" />
                  SSL
                </button>
                <button
                  onClick={() => setActiveTab('subdomains')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'subdomains'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  }`}
                >
                  <FaSitemap className="mr-2" />
                  Subdomains
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'email'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  }`}
                >
                  <FaEnvelope className="mr-2" />
                  Email
                </button>
              </div>
            </div>

            {activeTab === 'whois' && whoisData && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item} className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaServer className="mr-3 text-green-500" />
                      WHOIS Information
                    </h2>
                    {whoisData.domainName && (
                      <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                        {whoisData.domainName}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                      <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                        <FaGlobe className="mr-2 text-green-500/80" />
                        Domain Details
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Registrar:</span>
                          <span className="text-gray-300 font-mono text-right">{whoisData.registrar || 'Unknown'}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center">
                            <FaCalendarAlt className="mr-2 text-green-500/80" /> Created:
                          </span>
                          <span className="text-gray-300 font-mono">{formatDate(whoisData.creationDate)}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center">
                            <FaClock className="mr-2 text-green-500/80" /> Expires:
                          </span>
                          <span className="text-gray-300 font-mono">{formatDate(whoisData.expiryDate)}</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Updated:</span>
                          <span className="text-gray-300 font-mono">{formatDate(whoisData.updatedDate)}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                      <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                        <FaTerminal className="mr-2 text-green-500/80" />
                        Registrant Information
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-green-500 font-mono text-right">{whoisData.registrantName || 'Not Available'}</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Organization:</span>
                          <span className="text-gray-300 font-mono text-right">{whoisData.registrantOrganization || 'Not Available'}</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Email:</span>
                          <div className="flex items-center">
                            <span className="text-green-500 font-mono text-right truncate max-w-[150px]" title={whoisData.registrantEmail || 'Not Available'}>
                              {whoisData.registrantEmail || 'Not Available'}
                            </span>
                            {whoisData.registrantEmail && (
                              <button
                                onClick={() => copyToClipboard(whoisData.registrantEmail)}
                                className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
                                title="Copy email"
                              >
                                <FaCopy size={14} />
                              </button>
                            )}
                          </div>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-gray-300 font-mono text-right">{whoisData.registrantPhone || 'Not Available'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <motion.div variants={item}>
                    <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                      <FaTerminal className="mr-2 text-green-500/80" />
                      Domain Status
                    </h3>
                    <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                      <ul className="space-y-2">
                        {whoisData.status && Array.isArray(whoisData.status) && whoisData.status.map((status: string, index: number) => (
                          <li key={index} className="text-gray-300 font-mono">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-green-500">{status}</span>
                          </li>
                        ))}
                        {(!whoisData.status || !Array.isArray(whoisData.status) || whoisData.status.length === 0) && (
                          <li className="text-gray-400 font-mono">No status information available</li>
                        )}
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div variants={item}>
                    <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                      <FaServer className="mr-2 text-green-500/80" />
                      Name Servers
                    </h3>
                    <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                      <ul className="space-y-2">
                        {whoisData.nameServers && Array.isArray(whoisData.nameServers) && whoisData.nameServers.length > 0 && whoisData.nameServers.map((ns: string, index: number) => (
                          <li key={index} className="text-gray-300 font-mono">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-green-500">{ns}</span>
                          </li>
                        ))}
                        {(!whoisData.nameServers || !Array.isArray(whoisData.nameServers) || whoisData.nameServers.length === 0) && (
                          <li className="text-gray-400 font-mono">No name server information available</li>
                        )}
                      </ul>
                    </div>
                  </motion.div>
                </div>

                {/* Additional Registrant Details */}
                <motion.div variants={item} className="mt-6">
                  <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                    <FaTerminal className="mr-2 text-green-500/80" />
                    Detailed Contact Information
                  </h3>
                  <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-green-400 mb-2 border-b border-green-500/30 pb-1">Registrant Address</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-400">Street:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.registrantStreet || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">City:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.registrantCity || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">State/Province:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.registrantState || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Postal Code:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.registrantPostalCode || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Country:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.registrantCountry || 'Not Available'}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-green-400 mb-2 border-b border-green-500/30 pb-1">Administrative Contact</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-400">Name:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.adminName || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Organization:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.adminOrganization || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <div className="flex items-center">
                              <span className="text-gray-300 font-mono text-right truncate max-w-[120px]" title={whoisData.adminEmail || 'Not Available'}>
                                {whoisData.adminEmail || 'Not Available'}
                              </span>
                              {whoisData.adminEmail && (
                                <button
                                  onClick={() => copyToClipboard(whoisData.adminEmail)}
                                  className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
                                  title="Copy email"
                                >
                                  <FaCopy size={14} />
                                </button>
                              )}
                            </div>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Phone:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.adminPhone || 'Not Available'}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Country:</span>
                            <span className="text-gray-300 font-mono text-right">{whoisData.adminCountry || 'Not Available'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-green-500/20">
                      <h4 className="text-green-400 mb-2">Technical Contact</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-gray-300 font-mono text-right">{whoisData.techName || 'Not Available'}</span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-gray-400">Email:</span>
                          <div className="flex items-center">
                            <span className="text-gray-300 font-mono text-right truncate max-w-[200px]" title={whoisData.techEmail || 'Not Available'}>
                              {whoisData.techEmail || 'Not Available'}
                            </span>
                            {whoisData.techEmail && (
                              <button
                                onClick={() => copyToClipboard(whoisData.techEmail)}
                                className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
                                title="Copy email"
                              >
                                <FaCopy size={14} />
                              </button>
                            )}
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    {whoisData.registrarUrl && (
                      <div className="mt-4 pt-4 border-t border-green-500/20">
                        <h4 className="text-green-400 mb-2">Registrar Website</h4>
                        <a 
                          href={whoisData.registrarUrl.startsWith('http') ? whoisData.registrarUrl : `https://${whoisData.registrarUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-500 hover:underline flex items-center"
                        >
                          <FaLink className="mr-1" />
                          {whoisData.registrarUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'dns' && dnsData && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaGlobe className="mr-3 text-green-500" />
                      DNS Records
                    </h2>
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                      {domain}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {dnsData.a && dnsData.a.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg text-green-500 mb-3 font-mono flex items-center">
                          <FaTerminal className="mr-2" /> A Records
                        </h3>
                        <div className="terminal-text mb-2">$ dig {domain} A</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {dnsData.a.map((record: any, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1 flex justify-between">
                              <div>
                                <span className="text-gray-400">{record.name}</span> {record.ttl} IN A
                              </div>
                              <span className="text-green-500">{record.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dnsData.aaaa && dnsData.aaaa.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg text-green-500 mb-3 font-mono flex items-center">
                          <FaTerminal className="mr-2" /> AAAA Records
                        </h3>
                        <div className="terminal-text mb-2">$ dig {domain} AAAA</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {dnsData.aaaa.map((record: any, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1 flex justify-between">
                              <div>
                                <span className="text-gray-400">{record.name}</span> {record.ttl} IN AAAA
                              </div>
                              <span className="text-green-500">{record.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dnsData.mx && dnsData.mx.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg text-green-500 mb-3 font-mono flex items-center">
                          <FaTerminal className="mr-2" /> MX Records
                        </h3>
                        <div className="terminal-text mb-2">$ dig {domain} MX</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {dnsData.mx.map((record: any, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1 flex justify-between">
                              <div>
                                <span className="text-gray-400">{record.name}</span> {record.ttl} IN MX {record.priority}
                              </div>
                              <span className="text-green-500">{record.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dnsData.ns && dnsData.ns.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg text-green-500 mb-3 font-mono flex items-center">
                          <FaTerminal className="mr-2" /> NS Records
                        </h3>
                        <div className="terminal-text mb-2">$ dig {domain} NS</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {dnsData.ns.map((record: any, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1 flex justify-between">
                              <div>
                                <span className="text-gray-400">{record.name}</span> {record.ttl} IN NS
                              </div>
                              <span className="text-green-500">{record.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dnsData.txt && dnsData.txt.length > 0 && (
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg text-green-500 mb-3 font-mono flex items-center">
                          <FaTerminal className="mr-2" /> TXT Records
                        </h3>
                        <div className="terminal-text mb-2">$ dig {domain} TXT</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {dnsData.txt.map((record: any, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1">
                              <div className="flex justify-between">
                                <div>
                                  <span className="text-gray-400">{record.name}</span> {record.ttl} IN TXT
                                </div>
                                <button
                                  onClick={() => copyToClipboard(record.value)}
                                  className="text-gray-400 hover:text-green-500 transition-colors ml-2"
                                  title="Copy value"
                                >
                                  <FaCopy size={14} />
                                </button>
                              </div>
                              <div className="text-green-500 mt-1 break-all">{record.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!dnsData.a || dnsData.a.length === 0) && 
                     (!dnsData.aaaa || dnsData.aaaa.length === 0) && 
                     (!dnsData.mx || dnsData.mx.length === 0) && 
                     (!dnsData.ns || dnsData.ns.length === 0) && 
                     (!dnsData.txt || dnsData.txt.length === 0) && (
                      <div className="bg-gray-800 p-6 rounded-md text-center border border-green-500/30">
                        <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={24} />
                        <p className="text-gray-400 font-mono">No DNS records found for this domain</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'ssl' && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaShieldAlt className="mr-3 text-green-500" />
                      SSL Certificate Information
                    </h2>
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                      {domain}
                    </div>
                  </div>
                  
                  {sslData ? (
                    <>
                      <div className="bg-gray-800 p-6 rounded-md mb-6 border border-green-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg text-green-500 font-mono">Certificate Status</h3>
                          <div className={`px-3 py-1 rounded-full text-sm ${sslData.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} flex items-center`}>
                            {sslData.valid ? (
                              <>
                                <FaCheckCircle className="mr-1" /> Valid
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="mr-1" /> Invalid
                              </>
                            )}
                          </div>
                        </div>
                        
                        {sslData.valid ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <ul className="space-y-3">
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Subject:</span>
                                  <span className="text-green-500 font-mono">{sslData.subject || 'Unknown'}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Issuer:</span>
                                  <span className="text-green-500 font-mono truncate max-w-[180px]" title={sslData.issuer || 'Unknown'}>
                                    {sslData.issuer || 'Unknown'}
                                  </span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Protocol:</span>
                                  <span className="text-gray-300 font-mono">{sslData.protocol || 'Unknown'}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Cipher:</span>
                                  <span className="text-gray-300 font-mono">{sslData.cipher || 'Unknown'}</span>
                                </li>
                              </ul>
                            </div>
                            
                            <div>
                              <ul className="space-y-3">
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Valid From:</span>
                                  <span className="text-green-500 font-mono">{sslData.validFrom ? formatDate(sslData.validFrom) : 'Unknown'}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Valid To:</span>
                                  <span className="text-green-500 font-mono">{sslData.validTo ? formatDate(sslData.validTo) : 'Unknown'}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Days Remaining:</span>
                                  <span className={`font-mono ${
                                    sslData.daysRemaining !== undefined 
                                      ? (sslData.daysRemaining > 30 
                                        ? 'text-green-400' 
                                        : sslData.daysRemaining > 14 
                                          ? 'text-yellow-400' 
                                          : 'text-red-400')
                                      : 'text-gray-400'
                                  }`}>
                                    {sslData.daysRemaining != null ? `${sslData.daysRemaining} days` : 'Unknown'}
                                  </span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span className="text-gray-400">Serial:</span>
                                  <span className="text-gray-300 font-mono truncate max-w-[180px]" title={sslData.serialNumber || 'Unknown'}>
                                    {sslData.serialNumber || 'Unknown'}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-red-500/10 rounded-md border border-red-500/30">
                            <div className="flex items-center text-red-400 mb-2">
                              <FaExclamationTriangle className="mr-2" />
                              <span className="font-medium">Certificate Error</span>
                            </div>
                            <p className="text-red-400 text-sm">
                              {sslData.error || 'SSL certificate could not be verified'}
                            </p>
                          </div>
                        )}
                      </div>

                      {sslData.valid && (
                        <div className="p-4 bg-gray-800/50 rounded-md border border-green-500/30">
                          <p className="text-gray-400 text-sm flex items-start">
                            <FaShieldAlt className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>
                              The SSL certificate for <span className="text-green-500 glow-text">{domain}</span> is 
                              <span className="text-green-400 mx-1">valid</span>
                              and will expire in 
                              <span className={`font-semibold mx-1 ${
                                sslData.daysRemaining !== undefined 
                                  ? (sslData.daysRemaining > 30 
                                    ? 'text-green-400' 
                                    : sslData.daysRemaining > 14 
                                      ? 'text-yellow-400' 
                                      : 'text-red-400')
                                  : 'text-gray-400'
                              }`}>
                                {sslData.daysRemaining != null ? `${sslData.daysRemaining} days` : 'Unknown'}
                              </span>. 
                              The connection is <span className="text-green-500">secure</span> using modern encryption protocols.
                            </span>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-800 p-6 rounded-md text-center border border-green-500/30">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={24} />
                      <p className="text-gray-400">No SSL certificate information available for this domain.</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'email' && emailData && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item}>
                  <h2 className="text-xl font-bold mb-4 text-green-400">Email Information</h2>
                  
                  {/* Domain Email Addresses */}
                  {emailData.domainEmails && emailData.domainEmails.length > 0 && (
                    <div className="bg-gray-800 p-6 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">Domain Email Addresses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emailData.domainEmails.map((email: any, index: number) => (
                          <div key={index} className={`bg-gray-800/30 p-3 rounded-md flex items-center border ${email.status === 'valid' ? 'border-green-500/40' : email.status === 'invalid' ? 'border-red-500/40' : 'border-yellow-500/40'}`}>
                            <div className="mr-3 flex items-center">
                              <FaEnvelope className={`mr-2 ${email.status === 'valid' ? 'text-green-400' : email.status === 'invalid' ? 'text-red-400' : 'text-yellow-400'}`} />
                              {getEmailStatusIcon(email.status)}
                            </div>
                            <div className="flex-grow">
                              <div className="text-green-500 font-mono">{email.address}</div>
                              <div className="text-xs text-gray-400 mt-1">{getEmailStatusText(email.verification)}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(email.address)}
                              className="ml-auto text-gray-400 hover:text-green-400 transition-colors"
                              title="Copy email"
                            >
                              <FaCopy size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Third-Party Email Addresses */}
                  {emailData.thirdPartyEmails && emailData.thirdPartyEmails.length > 0 && (
                    <div className="bg-gray-800 p-6 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">Third-Party Email Addresses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emailData.thirdPartyEmails.map((email: any, index: number) => (
                          <div key={index} className={`bg-gray-800/30 p-3 rounded-md flex items-center ${email.status === 'valid' ? 'border border-green-500/40' : email.status === 'invalid' ? 'border border-red-500/40' : ''}`}>
                            <div className="mr-3 flex items-center">
                              <FaEnvelope className={`mr-2 ${email.status === 'valid' ? 'text-green-400' : email.status === 'invalid' ? 'text-red-400' : 'text-green-500'}`} />
                              {getEmailStatusIcon(email.status)}
                            </div>
                            <div className="flex-grow">
                              <div className="text-gray-300 font-mono">{email.address}</div>
                              <div className="text-xs text-gray-400 mt-1">{getEmailStatusText(email.verification)}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(email.address)}
                              className="ml-auto text-gray-400 hover:text-green-400 transition-colors"
                              title="Copy email"
                            >
                              <FaCopy size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Valid Email Addresses */}
                  {emailData.validEmails && emailData.validEmails.length > 0 && (
                    <div className="bg-gray-800 p-6 rounded-md mb-6">
                      <h3 className="text-lg text-green-400 mb-4 font-mono flex items-center">
                        <FaCheckCircle className="mr-2" /> 
                        Verified Email Addresses
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emailData.validEmails.map((email: any, index: number) => (
                          <div key={index} className="bg-gray-800/30 p-3 rounded-md flex items-center border border-green-500/40">
                            <FaEnvelope className="text-green-400 mr-3" />
                            <span className="text-green-500 font-mono">{email.address}</span>
                            <button
                              onClick={() => copyToClipboard(email.address)}
                              className="ml-auto text-gray-400 hover:text-green-400 transition-colors"
                              title="Copy email"
                            >
                              <FaCopy size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-gray-400">
                        These email addresses have been verified and are confirmed to exist.
                      </div>
                    </div>
                  )}
                  
                  {/* Show a message if no emails found in both categories */}
                  {(!emailData.domainEmails || emailData.domainEmails.length === 0) && 
                   (!emailData.thirdPartyEmails || emailData.thirdPartyEmails.length === 0) && (
                    <div className="bg-gray-800 p-6 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">Discovered Email Addresses</h3>
                      <div className="bg-gray-800/30 p-4 rounded-md text-center">
                        <FaExclamationTriangle className="text-yellow-400 mx-auto mb-2" size={24} />
                        <p className="text-gray-400">No email addresses were discovered for this domain.</p>
                      </div>
                    </div>
                  )}

                  {emailData && emailData.mailServers && emailData.mailServers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">Mail Servers</h3>
                      <div className="bg-gray-800 p-4 rounded-md">
                        <div className="terminal-text mb-2">$ dig {domain} MX</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          {emailData.mailServers.map((server: { ttl?: number; priority: number; host: string }, index: number) => (
                            <div key={index} className="font-mono text-sm text-gray-300 mb-1">
                              <span className="text-gray-400">{domain}</span> {server.ttl || 3600} IN MX {server.priority} <span className="text-green-500">{server.host}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {emailData && emailData.spfRecord && (
                    <div className="mt-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">SPF Record</h3>
                      <div className="bg-gray-800 p-4 rounded-md">
                        <div className="terminal-text mb-2">$ dig {domain} TXT</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          <div className="font-mono text-sm text-gray-300 mb-1">
                            <span className="text-gray-400">{domain}</span> IN TXT &quot;<span className="text-green-500">{emailData.spfRecord}</span>&quot;
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {emailData && emailData.dmarcRecord && (
                    <div className="mt-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">DMARC Record</h3>
                      <div className="bg-gray-800 p-4 rounded-md">
                        <div className="terminal-text mb-2">$ dig _dmarc.{domain} TXT</div>
                        <div className="border-t border-green-500/30 pt-2 mt-2">
                          <div className="font-mono text-sm text-gray-300 mb-1">
                            <span className="text-gray-400">_dmarc.{domain}</span> IN TXT &quot;<span className="text-green-500">{emailData.dmarcRecord}</span>&quot;
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'subdomains' && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaSitemap className="mr-3 text-green-500" />
                      Discovered Subdomains
                    </h2>
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                      {domain}
                    </div>
                  </div>
                  
                  {subdomains && subdomains.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm flex items-center">
                          <FaLink className="mr-2" />
                          {subdomains.length} subdomain{subdomains.length !== 1 ? 's' : ''} discovered
                        </div>
                        <div className="text-xs text-gray-400">Click on a subdomain to view details</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subdomains.map((subdomain: {
                          name: string;
                          ip: string;
                          sslInfo?: {
                            valid: boolean;
                            issuer: string;
                            validTo: string;
                            protocol: string;
                            error?: string;
                          }
                        }, index: number) => (
                          <div key={index} className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-green-500 font-mono truncate max-w-[180px]" title={subdomain.name}>
                                {subdomain.name}
                              </h3>
                              {subdomain.sslInfo && (
                                <div className={`px-2 py-1 rounded-full text-xs flex items-center ${subdomain.sslInfo.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {subdomain.sslInfo.valid ? (
                                    <>
                                      <FaCheckCircle className="mr-1" size={10} /> SSL Valid
                                    </>
                                  ) : (
                                    <>
                                      <FaTimesCircle className="mr-1" size={10} /> SSL Invalid
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-400 mb-3 flex items-center">
                              <span className="font-bold text-gray-300 mr-2">IP:</span> 
                              <span className="font-mono">{subdomain.ip || 'Unknown'}</span>
                              <button
                                onClick={() => copyToClipboard(subdomain.ip || '')}
                                className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
                                title="Copy IP"
                                disabled={!subdomain.ip}
                              >
                                <FaCopy size={12} />
                              </button>
                            </div>
                            
                            {subdomain.sslInfo && subdomain.sslInfo.valid && (
                              <div className="mt-3 border-t border-green-500/30 pt-3 text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-400">Issuer:</span>
                                  <span className="text-gray-300 truncate max-w-[150px]" title={subdomain.sslInfo.issuer}>
                                    {subdomain.sslInfo.issuer}
                                  </span>
                                </div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-400">Expires:</span>
                                  <span className="text-gray-300">{formatDate(subdomain.sslInfo.validTo)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Protocol:</span>
                                  <span className="text-gray-300">{subdomain.sslInfo.protocol}</span>
                                </div>
                              </div>
                            )}
                            
                            {subdomain.sslInfo && !subdomain.sslInfo.valid && (
                              <div className="mt-3 border-t border-green-500/30 pt-3 text-sm text-red-400">
                                <div className="flex items-start">
                                  <FaExclamationTriangle className="text-red-400 mr-2 mt-0.5 flex-shrink-0" size={12} />
                                  <span>{subdomain.sslInfo.error || 'Invalid SSL certificate'}</span>
                                </div>
                              </div>
                            )}
                            
                            {!subdomain.sslInfo && (
                              <div className="mt-3 border-t border-green-500/30 pt-3 text-sm text-gray-400">
                                <div className="flex items-center">
                                  <FaShieldAlt className="mr-2" size={12} />
                                  No SSL certificate found
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-3 text-right">
                              <a 
                                href={`https://${subdomain.name}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-green-400 hover:underline"
                              >
                                Visit <FaLink className="ml-1" size={10} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-6 rounded-md text-center border border-green-500/30">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={24} />
                      <p className="text-gray-400">No subdomains were discovered for this domain.</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'email' && !emailData && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center"
              >
                <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                <h3 className="text-lg font-semibold text-green-400 mb-2">No Email Data Available</h3>
                <p className="text-gray-400">
                  We couldn&apos;t find any email-related information for {domain}.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Main component with Suspense
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageLoader />}>
      <ResultsPageContent />
    </Suspense>
  );
} 
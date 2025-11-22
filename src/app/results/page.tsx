'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaServer, FaGlobe, FaShieldAlt, FaTerminal, FaArrowLeft, FaCopy, FaClock, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaSitemap, FaLink, FaRocket, FaCode, FaHistory, FaRedoAlt } from 'react-icons/fa';
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
  type?: string;
}

interface DnsData {
  a?: DnsRecord[];
  aaaa?: DnsRecord[];
  mx?: DnsRecord[];
  ns?: DnsRecord[];
  txt?: DnsRecord[];
  srv?: DnsRecord[];
  ptr?: DnsRecord[];
  naptr?: DnsRecord[];
  soa?: DnsRecord[];
  caa?: DnsRecord[];
  dnskey?: DnsRecord[];
  tlsa?: DnsRecord[];
  sshfp?: DnsRecord[];
  uri?: DnsRecord[];
  svcb?: DnsRecord[];
}

interface SslInfo {
  valid: boolean;
  error?: string;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  protocol?: string;
  cipher?: string;
  serialNumber?: string;
  fingerprint?: string;
  issuerDetails?: any;
  redirectTo?: string;
}

interface Subdomain {
  name: string;
  ip?: string;
  sslInfo?: SslInfo;
  available?: boolean;
  error?: string;
  httpOnly?: boolean;
}

// Add the CertificateInfo interface after the other interfaces
interface CertificateInfo {
  id: string;
  issuer_name: string;
  common_name: string;
  name_value: string;
  entry_timestamp: string;
  not_before: string;
  not_after: string;
  serial_number: string;
}

interface DomainHistoryEvent {
  action: string;
  date: string;
  description: string;
  registrar?: string;
}

interface DomainHistoryData {
  domain: string;
  events: DomainHistoryEvent[];
  activationCount: number;
  deactivationCount: number;
  transferCount: number;
  ownershipChanges: number;
  currentRegistrar?: string;
  registrant?: string;
  statuses?: string[];
  nameservers?: string[];
  usingFallback?: boolean;
  warning?: string | null;
}

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
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'whois' | 'dns' | 'ssl' | 'email' | 'subdomains' | 'certhistory' | 'history'>('whois');
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [dnsData, setDnsData] = useState<DnsData | null>(null);
  const [sslData, setSslData] = useState<SslInfo | null>(null);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [certHistoryData, setCertHistoryData] = useState<CertificateInfo[]>([]);
  const [domainHistoryData, setDomainHistoryData] = useState<DomainHistoryData | null>(null);
  const [apiErrors, setApiErrors] = useState<{[key: string]: boolean}>({
    whois: false,
    dns: false,
    ssl: false,
    subdomains: false,
    certHistory: false,
    history: false
  });
  // Add state to track which subdomains are being rechecked
  const [recheckingSSL, setRecheckingSSL] = useState<{[key: string]: boolean}>({});
  
  // Add state to track loading progress
  const [loadingProgress, setLoadingProgress] = useState<{
    total: number;
    completed: number;
    current: string;
  }>({
    total: 6, // WHOIS, DNS, SSL, Subdomains, DomainHistory, CertHistory
    completed: 0,
    current: 'Preparing to fetch data...'
  });
  
  // Add timer state
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setLoadingStatus('Initializing checks...');
        setLoadingProgress({
          total: 6, // WHOIS, DNS, SSL, Subdomains, DomainHistory, CertHistory
          completed: 0,
          current: 'Starting domain analysis'
        });
      
      // Start the timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      setTimerInterval(timer);
      
      setApiErrors({
        whois: false,
        dns: false,
        ssl: false,
        subdomains: false,
        certHistory: false,
        history: false
      });
      
      try {
        // Create separate fetch promises so we can handle individual failures
        setLoadingStatus('Fetching WHOIS information...');
        setLoadingProgress(prev => ({...prev, current: 'Checking domain registration'}));
        const whoisPromise = fetch(`/api/V1/GET/whois?domain=${encodeURIComponent(domain)}`);
        
        setLoadingStatus('Fetching DNS records...');
        setLoadingProgress(prev => ({...prev, current: 'Querying DNS servers', completed: 1}));
        const dnsPromise = fetch(`/api/V1/GET/dns?domain=${encodeURIComponent(domain)}`);
        
        // Change the order: fetch subdomains before SSL
        setLoadingStatus('Discovering subdomains...');
        setLoadingProgress(prev => ({...prev, current: 'Searching for subdomains', completed: 2}));
        const subdomainsPromise = fetch(`/api/V1/GET/subdomains?domain=${encodeURIComponent(domain)}`);
        
        // Move SSL check after subdomains
        setLoadingStatus('Checking SSL certificate...');
        setLoadingProgress(prev => ({...prev, current: 'Verifying SSL certificate', completed: 3}));
        
        // Start tracking SSL check time specifically
        const sslStartTime = Date.now();
        let sslElapsedTime = 0;
        const sslTimer = setInterval(() => {
          sslElapsedTime = Math.floor((Date.now() - sslStartTime) / 1000);
          setLoadingStatus(`Verifying SSL certificate... (${sslElapsedTime}s)`);
        }, 1000);
        
        const sslPromise = fetch(`/api/V1/GET/ssl?domain=${encodeURIComponent(domain)}&isMainDomain=true`)
          .finally(() => {
            // Clear the SSL timer when done
            clearInterval(sslTimer);
          });

        // Domain history lookup
        setLoadingStatus('Building domain history...');
        setLoadingProgress(prev => ({...prev, current: 'Reviewing lifecycle events', completed: 4}));
        const domainHistoryPromise = fetch(`/api/V1/GET/domainhistory?domain=${encodeURIComponent(domain)}`);

        // Execute all fetches in parallel
        const [whoisResponse, dnsResponse, subdomainsResponse, sslResponse, domainHistoryResponse] =
          await Promise.all([
            whoisPromise.catch(err => {
              console.error('Error fetching WHOIS data:', err);
              setApiErrors(prev => ({...prev, whois: true}));
              return new Response(JSON.stringify({ error: 'Failed to fetch WHOIS data' }));
            }),
            dnsPromise.catch(err => {
              console.error('Error fetching DNS data:', err);
              setApiErrors(prev => ({...prev, dns: true}));
              return new Response(JSON.stringify({ error: 'Failed to fetch DNS data' }));
            }),
            subdomainsPromise.catch(err => {
              console.error('Error fetching subdomains data:', err);
              setApiErrors(prev => ({...prev, subdomains: true}));
              return new Response(JSON.stringify({ error: 'Failed to fetch subdomains data' }));
            }),
            sslPromise.catch(err => {
              console.error('Error fetching SSL data:', err);
              setApiErrors(prev => ({...prev, ssl: true}));
              return new Response(JSON.stringify({ error: 'Failed to fetch SSL data' }));
            }),
            domainHistoryPromise.catch(err => {
              console.error('Error fetching domain history data:', err);
              setApiErrors(prev => ({...prev, history: true}));
              return new Response(JSON.stringify({ error: 'Failed to fetch domain history data' }));
            })
          ]);
        
        // Process each response individually, with error handling
        const processResponse = async (response: Response, dataType: string) => {
          try {
            if (!response.ok) {
              console.error(`Error with ${dataType} response:`, response.status, response.statusText);
              setApiErrors(prev => ({...prev, [dataType]: true}));
              return null;
            }
            return await response.json();
          } catch (err) {
            console.error(`Error parsing ${dataType} JSON:`, err);
            setApiErrors(prev => ({...prev, [dataType]: true}));
            return null;
          }
        };
        
        setLoadingStatus('Processing WHOIS data...');
        // Parse responses with error handling
        const whoisDataResult = await processResponse(whoisResponse, 'whois');
        
        setLoadingStatus('Processing DNS data...');
        const dnsDataResult = await processResponse(dnsResponse, 'dns');
        
        setLoadingStatus('Processing subdomains data...');
        const subdomainsDataResult = await processResponse(subdomainsResponse, 'subdomains');
        
        setLoadingStatus('Processing SSL data...');
        const sslDataResult = await processResponse(sslResponse, 'ssl');

        setLoadingStatus('Analyzing domain history...');
        setLoadingProgress(prev => ({...prev, current: 'Tracing ownership changes', completed: 4}));
        const domainHistoryDataResult = await processResponse(domainHistoryResponse, 'history');

        setLoadingStatus('Checking certificate history...');
        setLoadingProgress(prev => ({...prev, current: 'Analyzing certificate transparency logs', completed: 5}));
        const certHistoryPromise = fetch(`/api/V1/GET/certhistory?domain=${encodeURIComponent(domain)}`);
        
        const certHistoryResponse = await certHistoryPromise.catch(err => {
          console.error('Error fetching certificate history data:', err);
          setApiErrors(prev => ({...prev, certHistory: true}));
          return new Response(JSON.stringify({ error: 'Failed to fetch certificate history data' }));
        });
        
        setLoadingStatus('Processing certificate history...');
        const certHistoryDataResult = await processResponse(certHistoryResponse, 'certHistory');
        
        console.log('WHOIS Data:', whoisDataResult);
        console.log('DNS Data:', dnsDataResult);
        console.log('SSL Data:', sslDataResult);
        console.log('Subdomains Data:', subdomainsDataResult);
        console.log('Certificate History Data:', certHistoryDataResult);
        console.log('Domain History Data:', domainHistoryDataResult);
        
        // Set data safely with null fallbacks
        setWhoisData(whoisDataResult?.whoisData || null);
        setDnsData(dnsDataResult?.dnsRecords || null);
        setSslData(sslDataResult?.sslInfo || null);
        setDomainHistoryData(domainHistoryDataResult || null);

        // Process subdomains and check if the main domain is included
        const subdomainsData = subdomainsDataResult?.subdomains || [];
        setSubdomains(subdomainsData);
        
        // If main domain SSL check failed but we have it in subdomains, use that data
        if ((!sslDataResult || !sslDataResult.sslInfo) && subdomainsData.length > 0) {
          const mainDomainInSubdomains = subdomainsData.find((sub: Subdomain) => sub.name === domain);
          if (mainDomainInSubdomains && mainDomainInSubdomains.sslInfo) {
            setSslData(mainDomainInSubdomains.sslInfo);
          }
        }
        
        // Set certificate history data
        setCertHistoryData(certHistoryDataResult?.certificates || []);

        setLoadingProgress(prev => ({...prev, completed: 6, current: 'Complete'}));
        setLoadingStatus(`Domain analysis complete in ${Math.floor((Date.now() - startTime) / 1000)}s`);
        
        // If all APIs failed, show a general error
        const allFailed = Object.values(apiErrors).every(value => value === true);
        if (allFailed) {
          setError('Failed to fetch any domain information. Please try again later.');
        }
      } catch (error) {
        console.error('Error in overall fetch process:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoadingStatus(`Error encountered during analysis after ${Math.floor((Date.now() - startTime) / 1000)}s`);
      } finally {
        // Clear the timer
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup timer on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
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

  // Function to retry SSL check for a specific subdomain
  const retrySSLCheck = async (subdomain: string): Promise<SslInfo | null> => {
    // Track retry time
    const retryStartTime = Date.now();
    let retryElapsedTime = 0;
    
    try {
      // Set up a timer for this specific check
      const retryTimer = setInterval(() => {
        retryElapsedTime = Math.floor((Date.now() - retryStartTime) / 1000);
        setLoadingStatus(`Retrying SSL check for ${subdomain}... (${retryElapsedTime}s)`);
      }, 1000);
      
      // If it's the main domain, pass both isMainDomain and forceRetry flags
      const isMainDomain = subdomain === domain;
      let url = `/api/V1/GET/ssl?domain=${encodeURIComponent(subdomain)}`;
      
      if (isMainDomain) {
        url += '&isMainDomain=true&forceRetry=true';
      }
      
      setLoadingStatus(`Connecting to ${subdomain} for SSL verification...`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch SSL data: ${response.status}`);
      }
      
      setLoadingStatus(`Processing SSL certificate for ${subdomain}...`);
      const data = await response.json();
      
      // Clear the timer
      clearInterval(retryTimer);
      setLoadingStatus(`SSL check for ${subdomain} completed in ${retryElapsedTime}s`);
      
      return data.sslInfo || null;
    } catch (error) {
      console.error(`Error retrying SSL check for ${subdomain}:`, error);
      setLoadingStatus(`SSL check failed for ${subdomain} after ${retryElapsedTime}s`);
      return null;
    }
  };

  // Function to handle retrying SSL for a subdomain
  const handleRetrySSL = async (subdomain: string, index: number) => {
    // Mark this subdomain as rechecking
    setRecheckingSSL(prev => ({ ...prev, [subdomain]: true }));
    
    try {
      // Show status message
      setLoadingStatus(`Retrying SSL check for ${subdomain}...`);
      const sslInfo = await retrySSLCheck(subdomain);
      
      if (sslInfo) {
        // If this is the main domain (index = -1), just update the main SSL data
        if (index === -1) {
          setSslData(sslInfo);
        } else {
          // Update the subdomain's SSL info
          const updatedSubdomains = [...subdomains];
          updatedSubdomains[index] = {
            ...updatedSubdomains[index],
            sslInfo
          };
          setSubdomains(updatedSubdomains);
          
          // If this is the main domain in the subdomains list, also update the main SSL data
          if (subdomain === domain) {
            setSslData(sslInfo);
          }
        }
        
        setLoadingStatus(`Updated SSL information for ${subdomain}`);
      } else {
        setLoadingStatus(`Failed to get SSL information for ${subdomain}`);
      }
    } catch (error) {
      console.error(`Failed to recheck SSL for ${subdomain}:`, error);
      setLoadingStatus(`Error checking SSL for ${subdomain}`);
    } finally {
      // Clear the rechecking state
      setRecheckingSSL(prev => ({ ...prev, [subdomain]: false }));
      // Reset loading status after a delay
      setTimeout(() => {
        setLoadingStatus('Domain analysis complete');
      }, 3000);
    }
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
            <p className="mt-2 text-green-400">{loadingStatus}</p>
            
            {/* Timer display */}
            <p className="mt-2 text-yellow-400 font-mono">Time elapsed: {elapsedTime}s</p>
            
            {/* Progress bar */}
            <div className="w-full max-w-md mt-6">
              <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${(loadingProgress.completed / loadingProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">{loadingProgress.current}</p>
            </div>
            
            {/* Progress details */}
            <div className="mt-8 bg-gray-900/50 p-4 rounded-md border border-green-500/20 max-w-md w-full">
              <h3 className="text-xs uppercase tracking-wider text-green-500 mb-3">Analysis in Progress</h3>
              <ul className="space-y-2 text-xs">
                <li className={`flex items-center ${loadingProgress.completed >= 1 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 1 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 1 ? '✓' : '1'}
                  </span>
                  WHOIS Registration Data
                </li>
                <li className={`flex items-center ${loadingProgress.completed >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 2 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 2 ? '✓' : '2'}
                  </span>
                  DNS Records
                </li>
                <li className={`flex items-center ${loadingProgress.completed >= 3 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 3 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 3 ? '✓' : '3'}
                  </span>
                  SSL Certificate Analysis
                </li>
                <li className={`flex items-center ${loadingProgress.completed >= 4 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 4 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 4 ? '✓' : '4'}
                  </span>
                  Subdomain Discovery
                </li>
                <li className={`flex items-center ${loadingProgress.completed >= 5 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 5 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 5 ? '✓' : '5'}
                  </span>
                  Domain History Reconstruction
                </li>
                <li className={`flex items-center ${loadingProgress.completed >= 6 ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                    loadingProgress.completed >= 6 ? 'bg-green-900/50 text-green-500' : 'bg-gray-800'
                  }`}>
                    {loadingProgress.completed >= 6 ? '✓' : '6'}
                  </span>
                  Certificate Transparency Analysis
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-500 italic">
                SSL certificate checks may take longer due to connection timeouts
              </p>
            </div>
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
            {/* Side panel with tabs */}
            <div className="w-full lg:w-64 mb-6 lg:mb-0 flex-shrink-0">
              <div className="bg-gray-900/70 border border-green-500/30 rounded-md overflow-hidden mb-6">
                <div className="p-4 border-b border-green-500/30 flex items-center">
                  <FaTerminal className="text-green-500 mr-2" />
                  <h3 className="text-sm font-medium text-green-400">Analysis Tools</h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => setActiveTab('whois')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'whois' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaGlobe className="mr-2" /> WHOIS Lookup
                    {apiErrors.whois && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('dns')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'dns' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaServer className="mr-2" /> DNS Records
                    {apiErrors.dns && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('ssl')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'ssl' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaShieldAlt className="mr-2" /> SSL Certificate
                    {apiErrors.ssl && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('subdomains')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'subdomains' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaSitemap className="mr-2" /> Subdomains
                    {apiErrors.subdomains && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'history' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaHistory className="mr-2" /> Domain History
                    {apiErrors.history && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('certhistory')}
                    className={`w-full text-left px-3 py-2 rounded mb-1 text-sm flex items-center ${activeTab === 'certhistory' ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:text-green-400 hover:bg-green-900/10'}`}
                  >
                    <FaHistory className="mr-2" /> Certificate History
                    {apiErrors.certHistory && <FaExclamationTriangle className="ml-auto text-yellow-500" title="Error fetching data" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-900/70 border border-green-500/30 rounded-md overflow-hidden">
                {/* ... rest of existing sidebar content ... */}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 bg-gray-900/70 rounded-lg border border-green-500/30 p-1 sticky top-4 z-10 shadow-lg">
              <div className="flex flex-wrap">
                <button
                  onClick={() => setActiveTab('whois')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'whois'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.whois ? 'opacity-50' : ''}`}
                  disabled={apiErrors.whois}
                >
                  <FaGlobe className="mr-2" />
                  WHOIS {apiErrors.whois && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
                <button
                  onClick={() => setActiveTab('dns')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'dns'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.dns ? 'opacity-50' : ''}`}
                  disabled={apiErrors.dns}
                >
                  <FaServer className="mr-2" />
                  DNS {apiErrors.dns && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
                <button
                  onClick={() => setActiveTab('ssl')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'ssl'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.ssl ? 'opacity-50' : ''}`}
                  disabled={apiErrors.ssl}
                >
                  <FaShieldAlt className="mr-2" />
                  SSL {apiErrors.ssl && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
                <button
                  onClick={() => setActiveTab('subdomains')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'subdomains'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.subdomains ? 'opacity-50' : ''}`}
                  disabled={apiErrors.subdomains}
                >
                  <FaSitemap className="mr-2" />
                  Subdomains {apiErrors.subdomains && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'history'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.history ? 'opacity-50' : ''}`}
                  disabled={apiErrors.history}
                >
                  <FaHistory className="mr-2" />
                  History {apiErrors.history && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
                <button
                  onClick={() => setActiveTab('certhistory')}
                  className={`px-4 py-3 rounded-md flex items-center ${
                    activeTab === 'certhistory'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-green-400 hover:bg-black/30'
                  } ${apiErrors.certHistory ? 'opacity-50' : ''}`}
                  disabled={apiErrors.certHistory}
                >
                  <FaHistory className="mr-2" />
                  Cert History {apiErrors.certHistory && <FaExclamationTriangle className="ml-1 text-yellow-500" title="Data fetch failed" />}
                </button>
              </div>
            </div>

            {/* Show a partial error banner if some APIs failed but not all */}
            {Object.values(apiErrors).some(value => value) && !Object.values(apiErrors).every(value => value) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-400 mr-3" size={20} />
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-400">Partial Data Available</h3>
                    <p className="text-gray-300 text-xs mt-1">
                      Some information could not be retrieved. Disabled tabs indicate unavailable data.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

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
                  </div>
                  
                  {/* A Records */}
                  {dnsData.a && dnsData.a.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">A Records (IPv4)</h3>
                      <div className="terminal-text mb-2">$ dig {domain} A</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.a.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">A</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* AAAA Records */}
                  {dnsData.aaaa && dnsData.aaaa.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">AAAA Records (IPv6)</h3>
                      <div className="terminal-text mb-2">$ dig {domain} AAAA</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.aaaa.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">AAAA</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* MX Records */}
                  {dnsData.mx && dnsData.mx.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">MX Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} MX</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Priority</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.mx.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">MX</td>
                                <td className="py-2">{record.priority}</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* NS Records */}
                  {dnsData.ns && dnsData.ns.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">NS Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} NS</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.ns.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">NS</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* TXT Records */}
                  {dnsData.txt && dnsData.txt.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">TXT Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} TXT</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.txt.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">TXT</td>
                                <td className="py-2 text-green-500 break-words">&quot;{record.value}&quot;</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* SRV Records */}
                  {dnsData.srv && dnsData.srv.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">SRV Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} SRV</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Priority</th>
                              <th className="pb-2 text-green-400">Weight</th>
                              <th className="pb-2 text-green-400">Port</th>
                              <th className="pb-2 text-green-400">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.srv.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">SRV</td>
                                <td className="py-2">{(record as any).priority || '-'}</td>
                                <td className="py-2">{(record as any).weight || '-'}</td>
                                <td className="py-2">{(record as any).port || '-'}</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* PTR Records */}
                  {dnsData.ptr && dnsData.ptr.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">PTR Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} PTR</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.ptr.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">PTR</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NAPTR Records */}
                  {dnsData.naptr && dnsData.naptr.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">NAPTR Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} NAPTR</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.naptr.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">NAPTR</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SOA Records */}
                  {dnsData.soa && dnsData.soa.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">SOA Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} SOA</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.soa.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">SOA</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CAA Records */}
                  {dnsData.caa && dnsData.caa.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">CAA Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} CAA</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Flags</th>
                              <th className="pb-2 text-green-400">Tag</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.caa.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">CAA</td>
                                <td className="py-2">{(record as any).flags || '-'}</td>
                                <td className="py-2">{(record as any).tag || '-'}</td>
                                <td className="py-2 text-green-500">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* DNSKEY Records */}
                  {dnsData.dnskey && dnsData.dnskey.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">DNSKEY Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} DNSKEY</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.dnskey.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">DNSKEY</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* TLSA Records */}
                  {dnsData.tlsa && dnsData.tlsa.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">TLSA Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} TLSA</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.tlsa.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">TLSA</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* SSHFP Records */}
                  {dnsData.sshfp && dnsData.sshfp.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">SSHFP Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} SSHFP</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.sshfp.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">SSHFP</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* URI Records */}
                  {dnsData.uri && dnsData.uri.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">URI Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} URI</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.uri.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">URI</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* SVCB Records */}
                  {dnsData.svcb && dnsData.svcb.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-md mb-6">
                      <h3 className="text-lg text-green-500 mb-4 font-mono">SVCB Records</h3>
                      <div className="terminal-text mb-2">$ dig {domain} SVCB</div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="text-left border-b border-green-500/30">
                            <tr>
                              <th className="pb-2 text-green-400">Name</th>
                              <th className="pb-2 text-green-400">TTL</th>
                              <th className="pb-2 text-green-400">Type</th>
                              <th className="pb-2 text-green-400">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dnsData.svcb.map((record, index) => (
                              <tr key={index} className="font-mono text-sm text-gray-300">
                                <td className="py-2 text-gray-400">{record.name}</td>
                                <td className="py-2">{record.ttl || 3600}</td>
                                <td className="py-2">SVCB</td>
                                <td className="py-2 text-green-500 break-words">{record.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* No DNS Records */}
                  {(!dnsData.a || dnsData.a.length === 0) && 
                   (!dnsData.aaaa || dnsData.aaaa.length === 0) && 
                   (!dnsData.mx || dnsData.mx.length === 0) && 
                   (!dnsData.ns || dnsData.ns.length === 0) && 
                   (!dnsData.txt || dnsData.txt.length === 0) &&
                   (!dnsData.srv || dnsData.srv.length === 0) &&
                   (!dnsData.ptr || dnsData.ptr.length === 0) &&
                   (!dnsData.naptr || dnsData.naptr.length === 0) &&
                   (!dnsData.soa || dnsData.soa.length === 0) &&
                   (!dnsData.caa || dnsData.caa.length === 0) &&
                   (!dnsData.dnskey || dnsData.dnskey.length === 0) &&
                   (!dnsData.tlsa || dnsData.tlsa.length === 0) &&
                   (!dnsData.sshfp || dnsData.sshfp.length === 0) &&
                   (!dnsData.uri || dnsData.uri.length === 0) &&
                   (!dnsData.svcb || dnsData.svcb.length === 0) && (
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                      <h3 className="text-lg font-semibold text-green-400 mb-2">No DNS Records Found</h3>
                      <p className="text-gray-400">
                        We couldn&apos;t find any DNS records for {domain}.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'ssl' && sslData && (
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
                      SSL Certificate
                    </h2>
                    <div className="flex items-center">
                      {sslData.valid ? (
                        <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-mono border border-green-500/30">
                          <div className="flex items-center">
                            <FaCheckCircle className="mr-2" />
                            Valid
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm font-mono border border-red-500/30">
                          <div className="flex items-center">
                            <FaTimesCircle className="mr-2" />
                            Invalid
                          </div>
                        </div>
                      )}
                      {/* Add retry button for main domain SSL check */}
                      <button 
                        onClick={() => handleRetrySSL(domain, -1)} 
                        disabled={recheckingSSL[domain]}
                        className="ml-3 px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm font-mono border border-green-500/30 hover:bg-green-900/50 transition-colors inline-flex items-center"
                        title="Retry SSL check"
                      >
                        <FaRedoAlt className={`mr-2 ${recheckingSSL[domain] ? 'animate-spin' : ''}`} />
                        {recheckingSSL[domain] ? 'Checking...' : 'Retry Check'}
                      </button>
                    </div>
                  </div>
                  
                  {sslData.valid ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                          <FaShieldAlt className="mr-2 text-green-500/80" />
                          Certificate Details
                        </h3>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Issuer:</span>
                            <span className="text-gray-300 font-mono text-right">{sslData.issuer || 'Unknown'}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Subject:</span>
                            <span className="text-gray-300 font-mono text-right">{sslData.subject || domain}</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-gray-400 flex items-center">
                              <FaCalendarAlt className="mr-2 text-green-500/80" /> Valid From:
                            </span>
                            <span className="text-gray-300 font-mono">{formatDate(sslData.validFrom)}</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-gray-400 flex items-center">
                              <FaClock className="mr-2 text-green-500/80" /> Valid To:
                            </span>
                            <span className="text-gray-300 font-mono">{formatDate(sslData.validTo)}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Serial Number:</span>
                            <span className="text-gray-300 font-mono text-right truncate max-w-[200px]" title={sslData.serialNumber || 'Unknown'}>
                              {sslData.serialNumber || 'Unknown'}
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                        <h3 className="text-lg mb-3 text-green-500 font-mono flex items-center">
                          <FaTerminal className="mr-2 text-green-500/80" />
                          Connection Details
                        </h3>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Protocol:</span>
                            <span className="text-green-500 font-mono">{sslData.protocol || 'Unknown'}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Cipher:</span>
                            <span className="text-gray-300 font-mono">{sslData.cipher || 'Unknown'}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Fingerprint:</span>
                            <span className="text-gray-300 font-mono text-right truncate max-w-[200px]" title={sslData.fingerprint || 'Unknown'}>
                              {sslData.fingerprint || 'Unknown'}
                            </span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-400">Days Remaining:</span>
                            <span className={`font-mono ${
                              sslData.daysRemaining && sslData.daysRemaining > 30 
                                ? 'text-green-500' 
                                : sslData.daysRemaining && sslData.daysRemaining > 7 
                                  ? 'text-yellow-500' 
                                  : 'text-red-500'
                            }`}>
                              {sslData.daysRemaining !== undefined ? `${sslData.daysRemaining} days` : 'Unknown'}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-6">
                      <div className="text-center mb-6">
                        <FaExclamationTriangle className="text-red-400 mx-auto mb-4" size={32} />
                        <h3 className="text-lg font-semibold text-red-400 mb-2">SSL Certificate Error</h3>
                        <p className="text-gray-400">
                          {sslData.error || "This domain doesn't have a valid SSL certificate."}
                        </p>
                      </div>
                      
                      <div className="bg-gray-900/50 rounded-md p-4 border border-red-500/20 mt-4">
                        <h4 className="text-red-400 font-semibold mb-3 flex items-center">
                          <FaShieldAlt className="mr-2" /> SSL Troubleshooting
                        </h4>
                        
                        <ul className="space-y-3 text-sm">
                          {sslData.error?.includes('No SSL certificate found') && (
                            <>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  The domain appears to be accessible, but doesn't provide a valid SSL certificate.
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  This could mean the SSL certificate is not properly configured or is missing.
                                </span>
                              </li>
                            </>
                          )}
                          
                          {sslData.error?.includes('HTTP only') && (
                            <>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  This domain only supports HTTP (not HTTPS).
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  To use HTTPS, an SSL certificate needs to be installed on the server.
                                </span>
                              </li>
                            </>
                          )}
                          
                          {sslData.error?.includes('timeout') && (
                            <>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  The connection timed out while trying to check the SSL certificate.
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  This could be due to network issues or server configuration problems.
                                </span>
                              </li>
                            </>
                          )}
                          
                          {sslData.error?.includes('not available') && (
                            <>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  The domain could not be reached. Check if the domain name is correct.
                                </span>
                              </li>
                            </>
                          )}
                          
                          {sslData.redirectTo && (
                            <li className="flex items-start">
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                              <span className="text-gray-300">
                                The domain redirects to: <a href={sslData.redirectTo} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{sslData.redirectTo}</a>
                              </span>
                            </li>
                          )}
                          
                          {/* Default recommendations if no specific error matched */}
                          {!sslData.error?.includes('No SSL certificate found') && 
                           !sslData.error?.includes('HTTP only') && 
                           !sslData.error?.includes('timeout') && 
                           !sslData.error?.includes('not available') && (
                            <>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  Check if HTTPS is properly configured for this domain.
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></span>
                                <span className="text-gray-300">
                                  SSL certificate might be invalid, expired, or not properly installed.
                                </span>
                              </li>
                            </>
                          )}
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-red-500/20 flex justify-center">
                          <a 
                            href={`http://${domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-3 py-2 bg-gray-800 text-gray-300 rounded border border-gray-700 inline-flex items-center mr-4 hover:bg-gray-700 transition-colors"
                          >
                            <FaLink className="mr-2" /> Visit HTTP Version
                          </a>
                          
                          <a 
                            href={`https://${domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-3 py-2 bg-green-900/30 text-green-400 rounded border border-green-500/30 inline-flex items-center hover:bg-green-900/50 transition-colors"
                          >
                            <FaLink className="mr-2" /> Try HTTPS Anyway
                          </a>
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
                      Subdomains
                    </h2>
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                      Found: {subdomains.length}
                    </div>
                  </div>
                  
                  {subdomains && subdomains.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subdomains.map((subdomain, index) => (
                        <div key={index} className="bg-gray-800 p-4 rounded-md border border-green-500/30 hover:border-green-500 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-green-500 font-mono truncate max-w-[200px]" title={subdomain.name}>
                              {subdomain.name}
                            </h3>
                            <div className="flex items-center">
                              {subdomain.sslInfo && (
                                <div className={`px-2 py-0.5 rounded text-xs ${
                                  subdomain.sslInfo.valid ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                } mr-2`}>
                                  {subdomain.sslInfo.valid ? 'SSL' : 'No SSL'}
                                </div>
                              )}
                              {!subdomain.sslInfo && subdomain.available !== false && (
                                <div className="px-2 py-0.5 rounded text-xs bg-yellow-900/30 text-yellow-400 mr-2">
                                  SSL Unknown
                                </div>
                              )}
                              <button
                                onClick={() => copyToClipboard(subdomain.name)}
                                className="text-gray-400 hover:text-green-500 transition-colors"
                                title="Copy subdomain"
                              >
                                <FaCopy size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            {subdomain.available === false && (
                              <div className="flex justify-between py-1 border-b border-green-500/10">
                                <span className="text-gray-400">Status:</span>
                                <span className="text-red-400 font-mono">Not Available</span>
                              </div>
                            )}
                            
                            {subdomain.available && subdomain.httpOnly && (
                              <div className="flex justify-between py-1 border-b border-green-500/10">
                                <span className="text-gray-400">Connection:</span>
                                <span className="text-yellow-400 font-mono">HTTP Only</span>
                              </div>
                            )}
                            
                            {subdomain.ip && (
                              <div className="flex justify-between py-1 border-b border-green-500/10">
                                <span className="text-gray-400">IP Address:</span>
                                <span className="text-gray-300 font-mono">{subdomain.ip}</span>
                              </div>
                            )}
                            
                            {subdomain.sslInfo && subdomain.sslInfo.valid && (
                              <>
                                <div className="flex justify-between py-1 border-b border-green-500/10">
                                  <span className="text-gray-400">Issuer:</span>
                                  <span className="text-gray-300 font-mono truncate max-w-[180px]" title={subdomain.sslInfo.issuer || 'Unknown'}>
                                    {subdomain.sslInfo.issuer || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-green-500/10">
                                  <span className="text-gray-400">Expires:</span>
                                  <span className="text-gray-300 font-mono">{formatDate(subdomain.sslInfo.validTo)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-green-500/10">
                                  <span className="text-gray-400">Protocol:</span>
                                  <span className="text-gray-300 font-mono">{subdomain.sslInfo.protocol || 'Unknown'}</span>
                                </div>
                                {subdomain.sslInfo.daysRemaining !== undefined && (
                                  <div className="flex justify-between py-1 border-b border-green-500/10">
                                    <span className="text-gray-400">Days Remaining:</span>
                                    <span className={`font-mono ${
                                      subdomain.sslInfo.daysRemaining > 30 
                                        ? 'text-green-500' 
                                        : subdomain.sslInfo.daysRemaining > 7 
                                          ? 'text-yellow-500' 
                                          : 'text-red-500'
                                    }`}>
                                      {subdomain.sslInfo.daysRemaining} days
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {subdomain.sslInfo && !subdomain.sslInfo.valid && (
                              <div className="py-1 border-b border-green-500/10">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">SSL Status:</span>
                                  <span className="text-red-400">Invalid</span>
                                </div>
                                {subdomain.sslInfo.error && (
                                  <div className="mt-1 text-red-400/80 text-xs border-t border-green-500/10 pt-1 break-words">
                                    {subdomain.sslInfo.error}
                                  </div>
                                )}
                                <div className="mt-2 flex justify-end">
                                  <button 
                                    onClick={() => handleRetrySSL(subdomain.name, index)} 
                                    disabled={recheckingSSL[subdomain.name]}
                                    className="text-green-500 hover:text-green-400 transition-colors inline-flex items-center text-xs px-2 py-1 border border-green-500/30 rounded"
                                    title="Retry SSL check"
                                  >
                                    <FaRedoAlt className={`mr-1 ${recheckingSSL[subdomain.name] ? 'animate-spin' : ''}`} size={10} />
                                    <span>{recheckingSSL[subdomain.name] ? 'Checking...' : 'Retry SSL Check'}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Add retry button for subdomains without SSL info */}
                            {(!subdomain.sslInfo && subdomain.available !== false) && (
                              <div className="py-1 border-b border-green-500/10">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">SSL Status:</span>
                                  <span className="text-yellow-400">Unknown</span>
                                </div>
                                <div className="mt-2 flex justify-end">
                                  <button 
                                    onClick={() => handleRetrySSL(subdomain.name, index)} 
                                    disabled={recheckingSSL[subdomain.name]}
                                    className="text-green-500 hover:text-green-400 transition-colors inline-flex items-center text-xs px-2 py-1 border border-green-500/30 rounded"
                                    title="Check SSL"
                                  >
                                    <FaShieldAlt className={`mr-1 ${recheckingSSL[subdomain.name] ? 'animate-spin' : ''}`} size={10} />
                                    <span>{recheckingSSL[subdomain.name] ? 'Checking...' : 'Check SSL'}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-2 flex gap-2">
                              <a 
                                href={`https://${subdomain.name}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-green-500 hover:text-green-400 flex items-center text-xs"
                              >
                                <FaLink className="mr-1" /> Visit HTTPS
                              </a>
                              <a 
                                href={`http://${subdomain.name}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-green-400 flex items-center text-xs"
                              >
                                <FaLink className="mr-1" /> Visit HTTP
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                      <h3 className="text-lg font-semibold text-green-400 mb-2">No Subdomains Found</h3>
                      <p className="text-gray-400">
                        We couldn&apos;t find any subdomains for {domain}.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item} className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaHistory className="mr-3 text-green-500" />
                      Domain History Timeline
                    </h2>
                    {domainHistoryData?.events && (
                      <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                        Events: {domainHistoryData?.events.length || 0}
                      </div>
                    )}
                  </div>

                  {domainHistoryData?.warning && (
                    <div className="mb-4 bg-yellow-900/30 border border-yellow-500/40 rounded-md p-3 flex items-start">
                      <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1" />
                      <div>
                        <h4 className="text-yellow-400 font-semibold text-sm">Limited data</h4>
                        <p className="text-gray-300 text-sm">{domainHistoryData.warning}</p>
                      </div>
                    </div>
                  )}

                  {domainHistoryData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30">
                        <p className="text-gray-400 text-xs uppercase">Activations</p>
                        <p className="text-3xl font-bold text-green-400">{domainHistoryData.activationCount}</p>
                        <p className="text-xs text-gray-500">Registrations or restorations</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30">
                        <p className="text-gray-400 text-xs uppercase">Deactivations</p>
                        <p className="text-3xl font-bold text-green-400">{domainHistoryData.deactivationCount}</p>
                        <p className="text-xs text-gray-500">Expirations or deletions</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30">
                        <p className="text-gray-400 text-xs uppercase">Ownership changes</p>
                        <p className="text-3xl font-bold text-green-400">{domainHistoryData.ownershipChanges}</p>
                        <p className="text-xs text-gray-500">Transfer events detected</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center mb-6">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                      <p className="text-gray-300">Domain history could not be loaded.</p>
                    </div>
                  )}

                  {domainHistoryData?.events && domainHistoryData.events.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30">
                        <h3 className="text-lg text-green-500 mb-2 font-mono">Ownership & Registrar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Current Registrar:</span>
                            <span className="text-gray-200 font-mono text-right">{domainHistoryData.currentRegistrar || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Registrant:</span>
                            <span className="text-gray-200 font-mono text-right">{domainHistoryData.registrant || 'Not available'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Statuses:</span>
                            <span className="text-gray-200 font-mono text-right truncate max-w-[180px]" title={domainHistoryData.statuses?.join(', ') || 'Unknown'}>
                              {domainHistoryData.statuses?.join(', ') || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nameservers:</span>
                            <span className="text-gray-200 font-mono text-right truncate max-w-[180px]" title={domainHistoryData.nameservers?.join(', ') || 'Not listed'}>
                              {domainHistoryData.nameservers?.join(', ') || 'Not listed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800 p-4 rounded-md border border-green-500/30">
                        <h3 className="text-lg text-green-500 mb-3 font-mono">Lifecycle Timeline</h3>
                        <ul className="space-y-3">
                          {domainHistoryData.events.map((event, index) => (
                            <li key={`${event.action}-${event.date}-${index}`} className="flex items-start">
                              <div className="w-24 text-gray-400 text-xs font-mono mr-3">{formatDate(event.date)}</div>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 mt-1"></span>
                                  <span className="text-green-400 font-semibold mr-2 uppercase text-xs">{event.action}</span>
                                  {event.registrar && <span className="text-gray-400 text-xs">via {event.registrar}</span>}
                                </div>
                                <p className="text-gray-200 text-sm ml-4">{event.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                      <h3 className="text-lg font-semibold text-green-400 mb-2">No lifecycle events</h3>
                      <p className="text-gray-400">We couldn&apos;t reconstruct a history for {domain}.</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'certhistory' && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bg-gray-900 p-6 rounded-lg border border-green-500/30"
              >
                <motion.div variants={item}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-green-400 flex items-center">
                      <FaHistory className="mr-3 text-green-500" />
                      Certificate Transparency Logs
                    </h2>
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-sm text-green-500 font-mono">
                      Found: {certHistoryData.length}
                    </div>
                  </div>
                  
                  {certHistoryData && certHistoryData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-800 p-4 rounded-md mb-4">
                        <h3 className="text-lg text-green-500 mb-3 font-mono">About Certificate Transparency</h3>
                        <p className="text-gray-400 text-sm mb-2">
                          Certificate Transparency (CT) is an open framework for monitoring and auditing SSL/TLS certificates. 
                          By examining CT logs, you can discover certificates issued for your domain, which helps identify 
                          unauthorized certificates and potential security issues.
                        </p>
                        <p className="text-gray-400 text-sm">
                          The logs below show certificates that have been issued for <span className="text-green-400">{domain}</span> over time.
                        </p>
                        
                        {/* Show warning if we're using fallback data */}
                        {certHistoryData.length === 1 && certHistoryData[0].id === 'fallback-1' && (
                          <div className="mt-3 bg-yellow-900/30 p-3 rounded-md border border-yellow-500/30">
                            <div className="flex items-center text-yellow-400">
                              <FaExclamationTriangle className="mr-2" />
                              <span className="font-medium">Certificate data source unavailable</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                              We couldn't connect to the Certificate Transparency Log service. 
                              Limited certificate information is being displayed.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-800 border-b border-green-500/20">
                              <th className="text-left px-4 py-3 text-green-400">Issuer</th>
                              <th className="text-left px-4 py-3 text-green-400">Domain</th>
                              <th className="text-left px-4 py-3 text-green-400">Issued</th>
                              <th className="text-left px-4 py-3 text-green-400">Expires</th>
                              <th className="text-left px-4 py-3 text-green-400">Serial Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {certHistoryData.map((cert, index) => (
                              <tr 
                                key={cert.id} 
                                className={`${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/50'} hover:bg-gray-800 transition-colors`}
                              >
                                <td className="px-4 py-3 text-gray-300">
                                  {cert.issuer_name.split('CN=').pop()?.split(',')[0] || cert.issuer_name}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-green-400 font-mono">{cert.common_name}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                  {formatDate(cert.not_before)}
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                  {formatDate(cert.not_after)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-400 font-mono truncate block max-w-[150px]" title={cert.serial_number}>
                                    {cert.serial_number}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Only show security implications if we have real data */}
                      {(certHistoryData.length > 1 || certHistoryData[0].id !== 'fallback-1') && (
                        <div className="bg-gray-800/50 p-4 rounded-md mt-4 border border-green-500/20">
                          <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                            <FaShieldAlt className="mr-2" /> Security Implications
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-start">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></span>
                              <span>Unexpected certificates could indicate unauthorized issuance or potential phishing attempts</span>
                            </li>
                            <li className="flex items-start">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></span>
                              <span>Multiple issuers may be normal for organizations using different certificate authorities</span>
                            </li>
                            <li className="flex items-start">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></span>
                              <span>Certificates for unexpected subdomains could reveal hidden infrastructure</span>
                            </li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Retry button for CT logs */}
                      {certHistoryData.length === 1 && certHistoryData[0].id === 'fallback-1' && (
                        <div className="flex justify-center mt-4">
                          <button 
                            onClick={() => {
                              setApiErrors(prev => ({...prev, certHistory: false}));
                              setLoadingStatus('Retrying certificate history lookup...');
                              fetch(`/api/V1/GET/certhistory?domain=${encodeURIComponent(domain)}&t=${Date.now()}`)
                                .then(response => response.json())
                                .then(data => {
                                  if (data.certificates && data.certificates.length > 0) {
                                    setCertHistoryData(data.certificates);
                                    setLoadingStatus('Certificate history updated successfully');
                                  } else {
                                    setLoadingStatus('No additional certificate data available');
                                  }
                                })
                                .catch(err => {
                                  console.error('Error retrying cert history:', err);
                                  setLoadingStatus('Failed to refresh certificate data');
                                });
                            }}
                            className="bg-green-900/30 text-green-400 px-4 py-2 rounded-md border border-green-500/30 
                                     hover:bg-green-900/50 transition-colors flex items-center"
                          >
                            <FaRedoAlt className="mr-2" />
                            Retry Certificate Lookup
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6 text-center">
                      <FaExclamationTriangle className="text-yellow-400 mx-auto mb-4" size={32} />
                      <h3 className="text-lg font-semibold text-green-400 mb-2">No Certificate History Found</h3>
                      <p className="text-gray-400">
                        We couldn&apos;t find any certificate transparency logs for {domain}.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        This may indicate that no SSL certificates have been issued for this domain, or that they were issued before CT logging became widespread.
                      </p>
                      
                      {/* Add retry button */}
                      <button 
                        onClick={() => {
                          setApiErrors(prev => ({...prev, certHistory: false}));
                          setLoadingStatus('Retrying certificate history lookup...');
                          fetch(`/api/V1/GET/certhistory?domain=${encodeURIComponent(domain)}&t=${Date.now()}`)
                            .then(response => response.json())
                            .then(data => {
                              if (data.certificates && data.certificates.length > 0) {
                                setCertHistoryData(data.certificates);
                                setLoadingStatus('Certificate history updated successfully');
                              } else {
                                setLoadingStatus('No certificate data available');
                              }
                            })
                            .catch(err => {
                              console.error('Error retrying cert history:', err);
                              setLoadingStatus('Failed to refresh certificate data');
                            });
                        }}
                        className="bg-green-900/30 text-green-400 px-4 py-2 rounded-md border border-green-500/30 
                                 hover:bg-green-900/50 transition-colors flex items-center mx-auto mt-4"
                      >
                        <FaRedoAlt className="mr-2" />
                        Retry Certificate Lookup
                      </button>
                    </div>
                  )}
                </motion.div>
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
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCode, 
  FaTerminal, 
  FaLock, 
  FaEnvelope,
  FaGlobe, 
  FaNetworkWired, 
  FaFingerprint,
  FaBrain,
  FaShieldAlt,
  FaSearch,
  FaChevronRight,
  FaServer,
  FaSitemap,
  FaTools,
  FaCheckCircle,
  FaHistory
} from 'react-icons/fa';

export default function Futures() {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'versions'>('current');

  const toggleFeature = (featureId: string) => {
    if (expandedFeature === featureId) {
      setExpandedFeature(null);
    } else {
      setExpandedFeature(featureId);
    }
  };

  // Define current features
  const currentFeatures = [
    {
      id: "whois-lookup",
      title: "WHOIS Information",
      description: "Complete domain registration and ownership details.",
      icon: <FaServer className="text-green-500" />,
      details: `The WHOIS module provides:
- Domain registrar information
- Registration, expiration, and update dates
- Domain ownership details (when available)
- Registrant contact information
- Domain status codes
- Name server information
- Privacy protection status`
    },
    {
      id: "dns-records",
      title: "DNS Records Analysis",
      description: "Comprehensive DNS record lookup and verification.",
      icon: <FaGlobe className="text-green-500" />,
      details: `Our DNS module retrieves:
- A and AAAA records (IPv4 and IPv6)
- MX records for mail servers
- TXT records including SPF, DKIM
- NS records for name servers
- CNAME records for aliases
- SOA records for authoritative information
- SRV records for service discovery
- CAA records for certificate authorities`
    },
    {
      id: "ssl-analysis",
      title: "SSL Certificate Analysis",
      description: "Detailed SSL certificate verification and security assessment.",
      icon: <FaLock className="text-green-500" />,
      details: `The SSL certificate module provides:
- Certificate validity status
- Issuer identification
- Expiration tracking and alerts
- Protocol and cipher information
- Certificate chain verification
- Common security issues detection
- Self-signed certificate identification
- Days remaining until expiration with color-coded alerts`
    },
    {
      id: "subdomain-discovery",
      title: "Subdomain Discovery",
      description: "Find and analyze subdomains associated with the target domain.",
      icon: <FaSitemap className="text-green-500" />,
      details: `The subdomain discovery module includes:
- DNS-based subdomain enumeration
- Certificate transparency log searching
- Public records analysis
- IP resolution for each subdomain
- SSL certificate verification for each subdomain
- Direct links to visit discovered subdomains
- Status indicators for active vs. inactive subdomains`
    }
  ];

  // Define upcoming features
  const upcomingFeatures = [
    {
      id: "email-verification",
      title: "Email Address Discovery & Verification",
      description: "Find and verify email addresses associated with a domain.",
      icon: <FaEnvelope className="text-green-500" />,
      status: "In Progress",
      timeline: "Q3 2023",
      details: `Coming soon, our Email Discovery module will:
- Extract email addresses from domain's WHOIS information
- Find common email patterns associated with the domain
- Perform SMTP verification to validate discovered emails
- Score emails based on deliverability and validity
- Search for leaked emails in public breach databases (optional)`
    },
    {
      id: "subdomain-enum",
      title: "Advanced Subdomain Enumeration",
      description: "Comprehensive subdomain discovery beyond DNS records.",
      icon: <FaNetworkWired className="text-green-500" />,
      status: "Planned",
      timeline: "Q4 2023",
      details: `The enhanced subdomain module will include:
- Brute force discovery using larger wordlists
- Certificate transparency log searching
- Web archive (Wayback Machine) crawling
- Search engine discovery techniques
- DNS zone transfer attempts (when permitted)
- Permutation scanning with common patterns`
    },
    {
      id: "tech-fingerprinting",
      title: "Technology Fingerprinting",
      description: "Identify web technologies, frameworks, and services in use.",
      icon: <FaFingerprint className="text-green-500" />,
      status: "Planned",
      timeline: "Q4 2023",
      details: `This module will detect:
- Web servers and frameworks
- JavaScript libraries and frontend technologies
- CMS platforms and versions
- Analytics and marketing tools
- Cloud providers and hosting information
- Security technologies (WAF, CDN, etc.)
- Header analysis and server fingerprinting`
    },
    {
      id: "ai-insights",
      title: "AI-Powered Domain Insights",
      description: "Machine learning analysis of domain reputation and patterns.",
      icon: <FaBrain className="text-green-500" />,
      status: "Research",
      timeline: "Q1 2024",
      details: `Our AI module will provide:
- Domain age and reputation scoring
- Malicious activity prediction
- Content category classification
- Relationship mapping to other domains
- Anomaly detection in registration patterns
- Automated security recommendations
- Natural language summaries of domain profiles`
    },
    {
      id: "security-scanning",
      title: "Basic Security Scanning",
      description: "Identify common security misconfigurations and vulnerabilities.",
      icon: <FaShieldAlt className="text-green-500" />,
      status: "Planned",
      timeline: "Q4 2023",
      details: `The security module will check for:
- Missing or misconfigured SPF, DKIM, and DMARC records
- DNS CAA record validation
- HTTP security headers analysis
- TLS/SSL configuration weaknesses
- Open ports and services (basic)
- Domain typosquatting detection
- Publicly exposed sensitive directories`
    },
    {
      id: "api-integration",
      title: "API Integration & Automation",
      description: "Programmatic access to domain intelligence features.",
      icon: <FaCode className="text-green-500" />,
      status: "Planned",
      timeline: "Q1 2024",
      details: `The API will support:
- RESTful endpoints for all core features
- Batch processing of multiple domains
- Webhooks for scan completion notifications
- Rate limiting and usage tracking
- OAuth2 authentication
- Custom report generation
- Integration with popular security tools`
    }
  ];

  // Version history
  const versionHistory = [
    {
      version: "v1.0.0",
      date: "June 2023",
      title: "Initial Release",
      description: "First public release with core domain intelligence features.",
      changes: [
        "Basic WHOIS lookup functionality",
        "Simple DNS record retrieval",
        "SSL certificate verification",
        "Basic subdomain discovery"
      ]
    },
    {
      version: "v1.1.0",
      date: "August 2023",
      title: "UI Enhancements",
      description: "Major user interface improvements and design updates.",
      changes: [
        "Complete UI redesign with terminal-inspired theme",
        "Improved mobile responsiveness",
        "Added copy-to-clipboard functionality",
        "Enhanced data visualization"
      ]
    },
    {
      version: "v1.2.0",
      date: "October 2023",
      title: "Performance & Reliability",
      description: "Backend improvements for better reliability and speed.",
      changes: [
        "Improved error handling and timeout management",
        "Added retry logic for more reliable results",
        "Optimized subdomain discovery process",
        "Added batch processing for faster scanning",
        "Fixed SSL verification issues"
      ]
    },
    {
      version: "v1.3.0",
      date: "Current Version",
      title: "Feature Expansion",
      description: "New features and expanded capabilities.",
      changes: [
        "Enhanced subdomain discovery algorithms",
        "Improved SSL certificate analysis",
        "Added more detailed DNS record information",
        "Expanded WHOIS data presentation",
        "New developer-themed UI with green and black colors"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-12">
        <main className="flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full mb-12 max-w-5xl"
          >
            <div className="bg-gray-900 border border-green-500/30 rounded-t-md p-2 flex items-center">
              <div className="flex items-center space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400">domain-intel-roadmap.sh</div>
            </div>
            
            <div className="bg-gray-900/70 rounded-b-md border-x border-b border-green-500/30 p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span className="text-green-400">$</span> <span className="typing-animation">domain-intel --roadmap</span>
                <div className="mt-3 pl-4 text-sm space-y-1">
                  <p className="text-gray-400">Domain Intelligence Tool - Features & Development</p>
                  <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </motion.div>

              <div className="mb-6">
                <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-md">
                  <button 
                    onClick={() => setActiveTab('current')}
                    className={`px-4 py-2 rounded flex items-center ${
                      activeTab === 'current' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-green-400'
                    }`}
                  >
                    <FaCheckCircle className="mr-2" />
                    Current Features
                  </button>
                  <button 
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded flex items-center ${
                      activeTab === 'upcoming' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-green-400'
                    }`}
                  >
                    <FaTools className="mr-2" />
                    Upcoming Features
                  </button>
                  <button 
                    onClick={() => setActiveTab('versions')}
                    className={`px-4 py-2 rounded flex items-center ${
                      activeTab === 'versions' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-green-400'
                    }`}
                  >
                    <FaHistory className="mr-2" />
                    Version History
                  </button>
                </div>
              </div>

              {activeTab === 'current' && (
                <div className="mt-6 pl-4">
                  <div className="text-xl text-green-500 mb-4 font-mono">Current Features</div>
                  <p className="text-gray-400 mb-6 text-sm">
                    These features are currently available in the Domain Intelligence Tool. Click on any feature to see more details.
                  </p>
                  
                  <div className="space-y-4">
                    {currentFeatures.map((feature, index) => (
                      <motion.div 
                        key={feature.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (index * 0.1) }}
                        className={`border border-green-500/30 ${expandedFeature === feature.id ? 'bg-black/40' : 'bg-black/20'} rounded-md overflow-hidden transition-all duration-300`}
                      >
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-green-900/20"
                          onClick={() => toggleFeature(feature.id)}
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-xl">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-green-400">{feature.title}</h3>
                              <p className="text-gray-400 text-xs mt-1">{feature.description}</p>
                            </div>
                          </div>
                          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs">
                            Active
                          </div>
                        </div>
                        
                        {expandedFeature === feature.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-green-500/30 p-4 bg-black/40"
                          >
                            <pre className="text-xs text-green-400 whitespace-pre-wrap">{feature.details}</pre>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'upcoming' && (
                <div className="mt-6 pl-4">
                  <div className="text-xl text-green-500 mb-4 font-mono">Upcoming Features</div>
                  <p className="text-gray-400 mb-6 text-sm">
                    These features are currently in development or planned for future releases. Click on any feature to see more details.
                  </p>
                  
                  <div className="space-y-4">
                    {upcomingFeatures.map((feature, index) => (
                      <motion.div 
                        key={feature.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (index * 0.1) }}
                        className={`border border-green-500/20 ${expandedFeature === feature.id ? 'bg-black/40' : 'bg-black/20'} rounded-md overflow-hidden transition-all duration-300`}
                      >
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-green-900/20"
                          onClick={() => toggleFeature(feature.id)}
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-xl">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-green-400">{feature.title}</h3>
                              <p className="text-gray-400 text-xs mt-1">{feature.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-1 rounded-md mr-3 ${
                              feature.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400' : 
                              feature.status === 'Planned' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-purple-900/30 text-purple-400'
                            }`}>
                              {feature.status}
                            </span>
                            <span className="text-xs text-gray-400">{feature.timeline}</span>
                          </div>
                        </div>
                        
                        {expandedFeature === feature.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-green-500/20 p-4 bg-black/40"
                          >
                            <pre className="text-xs text-green-400 whitespace-pre-wrap">{feature.details}</pre>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="mt-6 pl-4">
                  <div className="text-xl text-green-500 mb-4 font-mono">Version History</div>
                  <p className="text-gray-400 mb-6 text-sm">
                    The development history of the Domain Intelligence Tool, showing feature additions and improvements over time.
                  </p>
                  
                  <div className="space-y-6 relative">
                    <div className="absolute left-[9px] top-8 bottom-4 w-[2px] bg-green-500/30"></div>
                    
                    {versionHistory.map((version, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (index * 0.1) }}
                        className="pl-8 relative"
                      >
                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-green-500 z-10"></div>
                        <div className={`border border-green-500/30 ${version.version === 'v1.3.0' ? 'bg-green-900/20' : 'bg-black/30'} rounded-md p-4`}>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-green-400">{version.version}</h3>
                            <span className="text-xs text-gray-400">{version.date}</span>
                          </div>
                          <h4 className="text-green-500 mb-2">{version.title}</h4>
                          <p className="text-gray-400 text-sm mb-3">{version.description}</p>
                          <ul className="space-y-1">
                            {version.changes.map((change, i) => (
                              <li key={i} className="text-xs text-gray-300 flex items-start">
                                <FaChevronRight className="text-green-500 mt-1 mr-2 text-[10px]" />
                                {change}
                              </li>
                            ))}
                          </ul>
                          {version.version === 'v1.3.0' && (
                            <div className="mt-2 text-xs inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              Current Release
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 bg-black/60 p-4 rounded border border-green-500/30"
              >
                <div className="flex items-center text-xs text-gray-400 mb-2">
                  <FaTerminal className="mr-2 text-green-500" />
                  <span>Feature Request</span>
                </div>
                <div className="text-xs text-gray-400">
                  <p>Would you like to request a new feature?</p>
                  <p className="mt-2">
                    <span className="text-green-400">$</span> domain-intel --request <span className="text-yellow-400">&quot;your feature idea&quot;</span>
                  </p>
                  <div className="mt-4 flex">
                    <input 
                      type="text" 
                      placeholder="Enter your feature request..."
                      className="flex-grow bg-black/50 border border-green-500/30 rounded-l px-3 py-2 text-green-400 focus:outline-none focus:border-green-500"
                    />
                    <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 px-4 py-2 rounded-r">
                      <FaSearch className="inline mr-1" /> Submit
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
} 
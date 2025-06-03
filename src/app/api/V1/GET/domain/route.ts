import { NextResponse } from 'next/server';
import whois from 'whois-json';
import dns from 'dns';
import { promisify } from 'util';
import https from 'https';
import { TLSSocket } from 'tls';
import net from 'net';
import { verifyEmailDomain } from 'email-domain-verifier';
import { verifyEmail as devVerifyEmail } from '@devmehq/email-validator-js';
import axios from 'axios';
// Import statistics functions
import { 
  updateDomainSearch, 
  updateSubdomainStats,
  updateSSLStats,
  updateDNSQueryCount,
  updateWHOISLookupCount,
  updateEmailCheckCount 
} from '@/lib/statistics';

// Convert DNS methods to promise-based functions
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// Type definitions for DNS records
interface MxRecord {
  priority: number;
  exchange: string;
}

interface VerifiedEmail {
  address: string;
  status: 'valid' | 'invalid' | 'unverified';
  verification: {
    domainExists: boolean;
    hasValidMxRecords: boolean;
    smtpCheck: boolean;
    formatValid: boolean;
  };
}

interface SSLInfo {
  valid: boolean;
  error?: string;
  issuer?: string | any;
  subject?: string;
  validFrom?: string | null | undefined;
  validTo?: string | null | undefined;
  daysRemaining?: number;
  protocol?: string;
  cipher?: string;
  serialNumber?: string | null | undefined;
  fingerprint?: string;
  issuerDetails?: any;
}

interface Subdomain {
  name: string;
  ip?: string;
  sslInfo?: SSLInfo;
}

// Function to extract potential emails from text content
const extractEmails = (text: string): string[] => {
  if (!text) return [];
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  
  // Filter out duplicates
  return [...new Set(matches)];
};

// Function to verify if an email is valid in format
const isValidEmailFormat = (email: string): boolean => {
  // Basic regex for email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Function to check if email domain exists and has MX records
const checkEmailDomain = async (email: string): Promise<{domainExists: boolean; hasValidMxRecords: boolean}> => {
  try {
    const domain = email.split('@')[1];
    
    // Check if domain has MX records
    try {
      const mxRecords = await resolveMx(domain);
      return { 
        domainExists: true, 
        hasValidMxRecords: mxRecords && mxRecords.length > 0 
      };
    } catch (error) {
      // Try A records if MX lookup fails
      try {
        await resolve4(domain);
        return { domainExists: true, hasValidMxRecords: false };
      } catch (error) {
        return { domainExists: false, hasValidMxRecords: false };
      }
    }
  } catch (error) {
    return { domainExists: false, hasValidMxRecords: false };
  }
};

// Function to check if email server responds (basic SMTP check)
const checkEmailSMTP = async (email: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const domain = email.split('@')[1];
      
      // First get MX records to find mail server
      resolveMx(domain)
        .then(mxRecords => {
          if (!mxRecords || mxRecords.length === 0) {
            resolve(false);
            return;
          }
          
          // Sort MX records by priority (lowest first)
          const sortedMxRecords = [...mxRecords].sort((a, b) => a.priority - b.priority);
          const mailServer = sortedMxRecords[0].exchange;
          
          // Connect to the mail server
          const socket = net.createConnection(25, mailServer);
          
          // Set timeout to prevent hanging
          socket.setTimeout(5000);
          
          let responseCode = 0;
          let completed = false;
          
          const finalize = (success: boolean) => {
            if (!completed) {
              completed = true;
              if (socket.writable) {
                socket.write('QUIT\r\n');
              }
              socket.end();
              resolve(success);
            }
          };
          
          socket.on('data', (data) => {
            const response = data.toString();
            const code = parseInt(response.substr(0, 3));
            
            if (responseCode === 0) {
              responseCode = code;
              
              if (code === 220) {
                // Server ready, send HELO
                socket.write(`HELO example.com\r\n`);
              } else {
                finalize(false);
              }
            } else if (responseCode === 220 && code === 250) {
              // HELO successful, send MAIL FROM
              socket.write(`MAIL FROM:<verify@example.com>\r\n`);
              responseCode = 250;
            } else if (responseCode === 250 && code === 250) {
              // MAIL FROM successful, send RCPT TO
              socket.write(`RCPT TO:<${email}>\r\n`);
              responseCode = 251;
            } else if (responseCode === 251) {
              // RCPT TO response
              finalize(code === 250 || code === 251);
            } else {
              finalize(false);
            }
          });
          
          socket.on('error', () => {
            finalize(false);
          });
          
          socket.on('timeout', () => {
            finalize(false);
          });
          
          socket.on('end', () => {
            finalize(false);
          });
        })
        .catch(() => {
          resolve(false);
        });
    } catch (error) {
      resolve(false);
    }
  });
};

// Advanced function to verify an email using @devmehq/email-validator-js
const advancedVerifyEmail = async (email: string): Promise<any> => {
  try {
    const result = await devVerifyEmail({
      emailAddress: email,
      verifyMx: true,
      verifySmtp: true,
      timeout: 7000
    });
    return result;
  } catch (error) {
    console.error('Error in advanced email verification:', error);
    return null;
  }
};

// Function to verify an email
const verifyEmail = async (email: string): Promise<VerifiedEmail> => {
  // Step 1: Check format
  const formatValid = isValidEmailFormat(email);
  if (!formatValid) {
    return {
      address: email,
      status: 'invalid',
      verification: {
        formatValid: false,
        domainExists: false,
        hasValidMxRecords: false,
        smtpCheck: false
      }
    };
  }
  
  // Try advanced verification first
  try {
    const advancedResult = await advancedVerifyEmail(email);
    
    if (advancedResult) {
      const isValid = advancedResult.validSmtp || (advancedResult.validFormat && advancedResult.validMx);
      
      return {
        address: email,
        status: isValid ? 'valid' : 'invalid',
        verification: {
          formatValid: advancedResult.validFormat,
          domainExists: advancedResult.validMx !== null,
          hasValidMxRecords: advancedResult.validMx === true,
          smtpCheck: advancedResult.validSmtp === true
        }
      };
    }
  } catch (error) {
    console.error('Error in advanced verification, falling back to basic verification', error);
  }
  
  // Step 2: Check domain and MX records
  const { domainExists, hasValidMxRecords } = await checkEmailDomain(email);
  
  if (!domainExists) {
    return {
      address: email,
      status: 'invalid',
      verification: {
        formatValid: true,
        domainExists: false,
        hasValidMxRecords: false,
        smtpCheck: false
      }
    };
  }
  
  // Step 3: Basic SMTP check (only if domain and MX records are valid)
  let smtpCheck = false;
  if (hasValidMxRecords) {
    smtpCheck = await checkEmailSMTP(email);
  }
  
  return {
    address: email,
    status: (hasValidMxRecords && smtpCheck) ? 'valid' : (hasValidMxRecords ? 'unverified' : 'invalid'),
    verification: {
      formatValid: true,
      domainExists,
      hasValidMxRecords,
      smtpCheck
    }
  };
};

// Function to try to identify registrar contact emails from DNS and WHOIS providers
const findRegistrarEmails = async (domain: string, registrar: string | null): Promise<string[]> => {
  const potentialEmails: string[] = [];
  
  // Check if we have registrar information to try more targeted emails
  if (registrar) {
    // Convert registrar name to a likely domain
    const registrarDomain = registrar.toLowerCase()
      .replace(/,? (inc|ltd|llc|corporation|corp|gmbh)\.?$/i, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    // Add common domain extensions
    const potentialDomains = [
      `${registrarDomain}.com`,
      `${registrarDomain}.net`,
      `${registrarDomain}.org`
    ];

    // Add common emails for each potential domain
    potentialDomains.forEach(domain => {
      potentialEmails.push(
        `abuse@${domain}`,
        `support@${domain}`,
        `contact@${domain}`,
        `info@${domain}`
      );
    });
  }

  // Add common registrar emails
  potentialEmails.push(
    'abuse@godaddy.com',
    'abuse@namecheap.com',
    'abuse@porkbun.com',
    'abuse@tucows.com',
    'abuse@networksolutions.com',
    'abuse@name.com',
    'abuse@cloudflare.com',
    'abuse@hostinger.com',
    'abuse@ionos.com',
    'abuse@hostgator.com',
    'abuse@bluehost.com',
    'abuse@dreamhost.com',
    'abuse@123-reg.co.uk',
    'abuse@one.com',
    'abuse@reg.ru',
    'abuse@reg.com',
    'abuse@ovh.com',
    'support@domains.google.com'
  );

  return potentialEmails;
};

// Advanced function to find domain-related emails using multiple approaches
const findDomainEmails = async (domain: string, whoisData: any): Promise<VerifiedEmail[]> => {
  // Store all potential emails to check
  const emailsToCheck: string[] = [];
  
  // Extract emails from all whois text fields
  Object.entries(whoisData).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const extractedEmails = extractEmails(value);
      if (extractedEmails.length > 0) {
        console.log(`Found ${extractedEmails.length} emails in WHOIS field "${key}": ${extractedEmails.join(', ')}`);
        emailsToCheck.push(...extractedEmails);
      }
    }
  });

  // Attempt to find registrar emails if we have registrar info
  let registrarEmails: string[] = [];
  if (whoisData.registrar) {
    registrarEmails = await findRegistrarEmails(domain, whoisData.registrar);
    emailsToCheck.push(...registrarEmails);
  }

  // Add some common contact emails for the domain itself as a fallback
  const domainEmails = [
    `admin@${domain}`,
    `webmaster@${domain}`, 
    `info@${domain}`,
    `contact@${domain}`,
    `support@${domain}`
  ];
  
  emailsToCheck.push(...domainEmails);
  
  // Filter out duplicates and sample emails like example@example.com
  const uniqueEmails = [...new Set(emailsToCheck)]
    .filter(email => !email.includes('example.com') && !email.includes('example@'));
  
  // If no emails found, just return an empty array
  if (uniqueEmails.length === 0) {
    return [];
  }

  console.log(`Found ${uniqueEmails.length} unique emails to verify for ${domain}`);

  // Verify each email (with a limit to avoid too many requests)
  const verificationPromises = uniqueEmails.slice(0, 20).map(email => verifyEmail(email));
  
  // Wait for all verifications to complete
  return await Promise.all(verificationPromises);
};

// Function to enhance WHOIS data with additional information
const enhanceWhoisData = (whoisData: any): any => {
  const enhanced = { ...whoisData };
  
  // Fix common issues with WHOIS data
  
  // 1. Handle status field which can be a string or array
  if (enhanced.status) {
    if (typeof enhanced.status === 'string') {
      enhanced.status = enhanced.status.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
  } else {
    // Try to find status in other fields
    const statusFields = ['domainStatus', 'Domain Status', 'status'];
    for (const field of statusFields) {
      if (enhanced[field]) {
        if (typeof enhanced[field] === 'string') {
          enhanced.status = enhanced[field].split('\n').map((s: string) => s.trim()).filter(Boolean);
        } else if (Array.isArray(enhanced[field])) {
          enhanced.status = enhanced[field];
        }
        break;
      }
    }
  }
  
  // 2. Handle name servers which can be in different fields
  if (!enhanced.nameServers || (Array.isArray(enhanced.nameServers) && enhanced.nameServers.length === 0)) {
    // Look for name servers in other fields
    const nsFields = ['nameServer', 'Name Server', 'nserver', 'ns'];
    
    for (const field of nsFields) {
      if (enhanced[field]) {
        if (typeof enhanced[field] === 'string') {
          enhanced.nameServers = enhanced[field]
            .split('\n')
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean);
        } else if (Array.isArray(enhanced[field])) {
          enhanced.nameServers = enhanced[field].map((ns: any) => 
            typeof ns === 'string' ? ns.trim().toLowerCase() : ns
          );
        }
        break;
      }
    }
  }
  
  // 3. Ensure creation, expiry and updated dates are proper
  const dateFields = [
    { result: 'creationDate', sources: ['creationDate', 'created', 'Creation Date', 'registrationDate'] },
    { result: 'expiryDate', sources: ['expiryDate', 'expires', 'Expiry Date', 'registrarRegistrationExpirationDate'] },
    { result: 'updatedDate', sources: ['updatedDate', 'changed', 'Updated Date', 'lastModified'] }
  ];
  
  for (const { result, sources } of dateFields) {
    if (!enhanced[result]) {
      for (const field of sources) {
        if (enhanced[field]) {
          enhanced[result] = enhanced[field];
          break;
        }
      }
    }
  }
  
  return enhanced;
};

// Function to get SSL certificate information
const getSSLInfo = async (hostname: string): Promise<SSLInfo> => {
  console.log(`Getting SSL info for: ${hostname}`);
  return new Promise((resolve) => {
    try {
      // First check if the hostname is reachable with a simple DNS lookup
      dns.lookup(hostname, (err) => {
        if (err) {
          console.log(`DNS lookup failed for ${hostname}: ${err.message}`);
          resolve({
            valid: false,
            error: `Domain not found: ${err.message}`
          });
          return;
        }

        const options = {
          hostname,
          port: 443,
          method: 'GET',
          rejectUnauthorized: false, // Allow self-signed certificates
          timeout: 3000 // Reduced timeout to 3 seconds for faster results
        };

        const req = https.request(options, (res) => {
          const socket = res.socket as TLSSocket;
          const cert = socket.getPeerCertificate();
          
          console.log(`Certificate received for ${hostname}:`, cert ? 'Yes' : 'No');
          
          if (!cert || Object.keys(cert).length === 0) {
            console.log(`No certificate found for ${hostname}`);
            resolve({
              valid: false,
              error: 'No SSL certificate found'
            });
            return;
          }

          // Calculate days remaining
          const validTo = cert.valid_to ? new Date(cert.valid_to) : new Date();
          const now = new Date();
          const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Get protocol version
          const protocol = socket.getProtocol ? socket.getProtocol() : 'Unknown';
          
          // Get cipher
          const cipher = socket.getCipher ? socket.getCipher() : { name: 'Unknown' };
          
          console.log(`SSL cert for ${hostname} - validFrom: ${cert.valid_from}, validTo: ${cert.valid_to}, protocol: ${protocol}`);
          
          // Type assertion to work around TypeScript null vs undefined issues
          const sslInfo: SSLInfo = {
            valid: true,
            issuer: cert.issuer?.O || cert.issuer || 'Unknown',
            subject: cert.subject?.CN || hostname,
            validFrom: cert.valid_from as string | undefined,
            validTo: cert.valid_to as string | undefined,
            daysRemaining: daysRemaining,
            protocol: protocol as string | undefined,
            cipher: cipher.name,
            serialNumber: cert.serialNumber as string | undefined,
            fingerprint: cert.fingerprint || 'Unknown',
            issuerDetails: cert.issuer || {}
          };
          
          console.log(`SSL info constructed for ${hostname}:`, JSON.stringify(sslInfo, null, 2));
          resolve(sslInfo);
        });

        req.on('error', (err) => {
          console.error(`SSL request error for ${hostname}: ${err.message}`);
          resolve({
            valid: false,
            error: `Connection error: ${err.message}`
          });
        });

        req.on('timeout', () => {
          console.error(`SSL request timeout for ${hostname}`);
          req.destroy();
          resolve({
            valid: false,
            error: 'Connection timed out'
          });
        });

        // Set a safety timeout to ensure the request completes
        const safetyTimeout = setTimeout(() => {
          req.destroy();
          console.error(`Safety timeout triggered for ${hostname}`);
          resolve({
            valid: false,
            error: 'Request took too long'
          });
        }, 4000); // 4 second safety timeout

        req.on('close', () => {
          clearTimeout(safetyTimeout);
        });

        req.end();
      });
    } catch (error: any) {
      console.error(`SSL general error for ${hostname}:`, error.message || 'Unknown error');
      resolve({
        valid: false,
        error: error.message || 'Unknown error'
      });
    }
  });
};

// Function to attempt to fetch name servers from DNS as a fallback
const getNameServersFromDNS = async (domain: string): Promise<string[]> => {
  try {
    const nsRecords = await resolveNs(domain);
    return nsRecords || [];
  } catch (error: any) {
    console.error('Error fetching NS records from DNS:', error);
    return [];
  }
};

// Function to discover subdomains for a given domain
const discoverSubdomains = async (domain: string): Promise<Subdomain[]> => {
  console.log('Starting subdomain discovery for', domain);
  const subdomains: Subdomain[] = [];
  
  // Common subdomain prefixes to check
  const commonSubdomains = [
    'www', 'mail', 'webmail', 'smtp', 'pop', 'imap', 'admin', 'blog',
    'shop', 'store', 'api', 'dev', 'staging', 'test', 'app', 'mobile',
    'm', 'cpanel', 'webdisk', 'ftp', 'panel', 'dashboard', 'cdn',
    'media', 'img', 'images', 'video', 'static', 'assets', 'files',
    'download', 'beta', 'secure', 'portal', 'server', 'ns1', 'ns2',
    'mx', 'autoconfig', 'autodiscover', 'remote', 'vpn', 'support',
    'docs', 'help', 'kb', 'wiki', 'status', 'git', 'svn', 'jenkins',
    'jira', 'confluence', 'forum', 'community', 'chat'
  ];
  
  // Check A records for common subdomains - use DNS lookup first to find valid subdomains
  // without immediately checking SSL to avoid timeouts
  const checkSubdomainPromises = commonSubdomains.map(async (prefix) => {
    const subdomain = `${prefix}.${domain}`;
    try {
      // Try to resolve the IP for this subdomain
      const addresses = await resolve4(subdomain);
      if (addresses && addresses.length > 0) {
        // We found a valid subdomain
        const sub: Subdomain = {
          name: subdomain,
          ip: addresses[0]
        };
        
        return sub;
      }
    } catch (error) {
      // This is expected for non-existent subdomains
      return null;
    }
    return null;
  });
  
  // Wait for all subdomain checks to complete
  const results = await Promise.all(checkSubdomainPromises);
  
  // Filter out null results and add valid subdomains
  const validSubdomains = results.filter(Boolean) as Subdomain[];
  
  console.log(`Found ${validSubdomains.length} subdomains for ${domain}`);
  
  // Now check SSL for each valid subdomain in a controlled way to avoid excessive timeouts
  // Process in batches to avoid overwhelming the system
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < validSubdomains.length; i += batchSize) {
    batches.push(validSubdomains.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    // Process each batch in parallel
    const sslCheckPromises = batch.map(async (subdomain) => {
      try {
        // Check SSL with a shorter timeout to avoid long delays
        const sslInfo = await getSSLInfo(subdomain.name);
        subdomain.sslInfo = sslInfo;
      } catch (error) {
        console.error(`Error getting SSL info for ${subdomain.name}:`, error);
        subdomain.sslInfo = {
          valid: false,
          error: 'Error checking SSL certificate'
        };
      }
      return subdomain;
    });
    
    // Wait for this batch to complete before moving to the next
    const processedBatch = await Promise.all(sslCheckPromises);
    subdomains.push(...processedBatch);
    
    // Short delay between batches to be nice to the system
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Update subdomain statistics
  await updateSubdomainStats(domain, subdomains.length);
  
  return subdomains;
};

export async function GET(request: Request) {
  console.log('Starting domain processing');
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    // Update domain search statistics
    await updateDomainSearch(domain);
    
    console.log(`Starting subdomain discovery for ${domain}`);
    
    // Process domain data in parallel for faster response
    const [whoisData, subdomains, dnsData] = await Promise.all([
      // WHOIS lookup
      (async () => {
        try {
          const data = await whois(domain);
          // Update WHOIS lookup statistics
          await updateWHOISLookupCount();
          return enhanceWhoisData(data);
        } catch (error) {
          console.error(`Error in WHOIS lookup for ${domain}:`, error);
          return null;
        }
      })(),
      
      // Subdomain discovery
      (async () => {
        try {
          const data = await discoverSubdomains(domain);
          // Update subdomain statistics
          await updateSubdomainStats(domain, data.length);
          return data;
        } catch (error) {
          console.error(`Error in subdomain discovery for ${domain}:`, error);
          return [];
        }
      })(),
      
      // DNS records
      (async () => {
        try {
          const records: Record<string, any> = {};
          
          try {
            const aRecords = await resolve4(domain);
            records['a'] = aRecords.map(ip => ({
              name: domain,
              ttl: 3600, // Default TTL since the DNS library doesn't provide it
              type: 'A',
              value: ip
            }));
          } catch (e) {}
          
          try {
            const aaaaRecords = await resolve6(domain);
            records['aaaa'] = aaaaRecords.map(ip => ({
              name: domain,
              ttl: 3600,
              type: 'AAAA',
              value: ip
            }));
          } catch (e) {}
          
          try {
            const mxRecords = await resolveMx(domain);
            records['mx'] = mxRecords.map(record => ({
              name: domain,
              ttl: 3600,
              type: 'MX',
              priority: record.priority,
              value: record.exchange
            }));
          } catch (e) {}
          
          try {
            const txtRecords = await resolveTxt(domain);
            records['txt'] = txtRecords.map(values => ({
              name: domain,
              ttl: 3600,
              type: 'TXT',
              value: values.join(' ')
            }));
          } catch (e) {}
          
          try {
            const nsRecords = await resolveNs(domain);
            records['ns'] = nsRecords.map(server => ({
              name: domain,
              ttl: 3600,
              type: 'NS',
              value: server
            }));
          } catch (e) {}
          
          // Update DNS query statistics - count the number of successful queries
          const successfulQueries = Object.keys(records).length;
          await updateDNSQueryCount(successfulQueries);
          
          return records;
        } catch (error) {
          console.error(`Error in DNS lookup for ${domain}:`, error);
          return {};
        }
      })(),
    ]);
    
    // SSL check for main domain
    console.log(`Getting SSL info for: ${domain}`);
    const sslInfo = await getSSLInfo(domain);
    
    // Update SSL statistics
    await updateSSLStats(
      sslInfo.valid ? 1 : 0,  // Valid count
      (!sslInfo.valid && !sslInfo.error?.includes('expired')) ? 1 : 0,  // Invalid count
      (sslInfo.error?.includes('expired')) ? 1 : 0  // Expired count
    );
    
    // Process emails from WHOIS data
    let emailInfo: VerifiedEmail[] = [];
    if (whoisData) {
      const emails = await findDomainEmails(domain, whoisData);
      emailInfo = emails;
      
      // Update email check statistics
      await updateEmailCheckCount(emails.length);
    }
    
    // Construct response object
    const response = {
      domain,
      whoisData,
      dnsRecords: dnsData,
      sslInfo,
      subdomains,
      emails: emailInfo
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error processing domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process domain information' }, { status: 500 });
  }
} 
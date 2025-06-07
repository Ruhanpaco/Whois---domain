import { NextResponse } from 'next/server';
import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';
import { updateSubdomainStats } from '@/lib/statistics';
const { getSSLInfo, checkDomainAvailability } = require('@/lib/sslChecker');

// Convert DNS methods to promise-based functions
const resolve4 = promisify(dns.resolve4);

interface Subdomain {
  name: string;
  ip?: string;
  sslInfo?: any;
  available?: boolean;
  statusCode?: number;
}

// Function to get subdomain information with additional checks
const getSubdomainInfo = async (subdomain: string) => {
  try {
    // Check if domain is reachable first
    const availability = await checkDomainAvailability(subdomain);
    
    if (!availability.alive) {
      return {
        name: subdomain,
        available: false,
        error: availability.error
      };
    }
    
    // Get SSL info with our enhanced checker (with reduced timeouts)
    const sslInfo = await getSSLInfo(subdomain, {
      timeout: 4000,    // Reduced from 8000ms to 4000ms
      maxRetries: 0,    // No retries
      retryDelay: 0     // No delay needed
    });
    
    return {
      name: subdomain,
      ip: sslInfo.ip || availability.ip,
      sslInfo,
      available: true
    };
  } catch (error) {
    console.error(`Error getting info for subdomain ${subdomain}:`, error);
    return {
      name: subdomain,
      available: false,
      error: `Failed to get information: ${error}`
    };
  }
};

// Helper to check if a discovered subdomain is valid
const isValidSubdomain = (subdomain: string, baseDomain: string) => {
  return subdomain.includes(baseDomain) && 
         subdomain !== baseDomain && 
         subdomain !== `www.${baseDomain}` && 
         !subdomain.includes('*');
};

// Function to discover subdomains using multiple sources
const discoverSubdomains = async (domain: string) => {
  console.log(`Starting subdomain discovery for ${domain}`);
  const subdomains = new Set<string>();
  
  // Always add the base domain and www subdomain
  subdomains.add(domain);
  subdomains.add(`www.${domain}`);
  
  try {
    // Try to fetch subdomain data from crt.sh (Certificate Transparency logs)
    const crtshResponse = await axios.get(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, {
      timeout: 8000,  // Reduced from 10000ms to 8000ms
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (Array.isArray(crtshResponse.data)) {
      crtshResponse.data.forEach((cert: any) => {
        const nameValue = cert.name_value || '';
        if (nameValue.includes(domain)) {
          nameValue.split('\n').forEach((name: string) => {
            name = name.trim().toLowerCase();
            if (isValidSubdomain(name, domain)) {
              subdomains.add(name);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error(`Error fetching data from crt.sh:`, error);
    // Continue with other methods even if this one fails
  }
  
  // Return a unique list of subdomains
  console.log(`Found ${subdomains.size} subdomains for ${domain}`);
  return [...subdomains];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    // Discover subdomains first
    const subdomainList = await discoverSubdomains(domain);
    
    // Get detailed info for each subdomain - process in parallel, but limit concurrency
    const results: Subdomain[] = [];
    const batchSize = 1; // Reduced to 1 (process one at a time) for better reliability
    
    for (let i = 0; i < subdomainList.length; i += batchSize) {
      const batch = subdomainList.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(sub => getSubdomainInfo(sub)));
      results.push(...batchResults);
      
      // Add a short delay between batches to prevent overwhelming the server
      if (i + batchSize < subdomainList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1000ms
      }
    }
    
    // Update statistics
    await updateSubdomainStats(domain, results.length);
    
    return NextResponse.json({ domain, subdomains: results });
  } catch (error) {
    console.error(`Error processing subdomains for domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process subdomain information' }, { status: 500 });
  }
} 
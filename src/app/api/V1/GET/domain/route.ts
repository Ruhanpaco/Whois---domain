import { NextResponse } from 'next/server';
import axios from 'axios';
import { updateDomainSearch } from '@/lib/statistics';

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
    
    console.log(`Processing domain information for ${domain}`);

    // Construct the base URL for API requests
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}/api/V1/GET`;
    
    // Process domain data in parallel for faster response
    const [whoisData, sslData, dnsData, subdomainsData, emailsData, certHistoryData] = await Promise.all([
      // WHOIS data
      axios.get(`${baseUrl}/whois?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching WHOIS data: ${error.message}`);
          return { domain, error: 'Failed to fetch WHOIS data' };
        }),
      
      // SSL data
      axios.get(`${baseUrl}/ssl?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching SSL data: ${error.message}`);
          return { domain, error: 'Failed to fetch SSL data' };
        }),
      
      // DNS data
      axios.get(`${baseUrl}/dns?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching DNS data: ${error.message}`);
          return { domain, error: 'Failed to fetch DNS data' };
        }),
      
      // Subdomains data
      axios.get(`${baseUrl}/subdomains?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching subdomains data: ${error.message}`);
          return { domain, error: 'Failed to fetch subdomains data' };
        }),
      
      // Emails data
      axios.get(`${baseUrl}/emails?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching emails data: ${error.message}`);
          return { domain, error: 'Failed to fetch emails data' };
        }),
        
      // Certificate History data
      axios.get(`${baseUrl}/certhistory?domain=${domain}`)
        .then(response => response.data)
        .catch(error => {
          console.error(`Error fetching certificate history data: ${error.message}`);
          return { domain, error: 'Failed to fetch certificate history data' };
        }),
    ]);
    
    // Construct response object
    const response = {
      domain,
      whoisData: whoisData.whoisData,
      dnsRecords: dnsData.dnsRecords,
      sslInfo: sslData.sslInfo,
      subdomains: subdomainsData.subdomains,
      emails: emailsData.emails,
      certHistory: {
        certificateCount: certHistoryData.certificateCount || 0,
        certificates: certHistoryData.certificates || []
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error processing domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process domain information' }, { status: 500 });
  }
} 
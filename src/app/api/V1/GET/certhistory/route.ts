import { NextResponse } from 'next/server';
import axios from 'axios';
import { updateCertHistoryLookupCount } from '@/lib/statistics';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    console.log(`Getting certificate history for: ${domain}`);
    
    let certificates: CertificateInfo[] = [];
    let fetchError = null;
    
    // Try primary source (crt.sh)
    try {
      // Fetch certificate history from crt.sh (Certificate Transparency Search)
      const response = await axios.get(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, {
        timeout: 8000, // 8 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.status === 200) {
        // Process the certificate data
        const data = response.data;
        
        if (Array.isArray(data)) {
          // Map the data to our format
          certificates = data.map((cert: any) => ({
            id: cert.id?.toString() || '',
            issuer_name: cert.issuer_name || '',
            common_name: cert.common_name || '',
            name_value: cert.name_value || '',
            entry_timestamp: cert.entry_timestamp || '',
            not_before: cert.not_before || '',
            not_after: cert.not_after || '',
            serial_number: cert.serial_number || ''
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching from crt.sh:`, error);
      fetchError = error;
      
      // Primary source failed, so we'll use a mock response for now
      // In a production app, you would implement a secondary source here
      certificates = [
        {
          id: 'fallback-1',
          issuer_name: 'Certificate data is temporarily unavailable',
          common_name: domain,
          name_value: domain,
          entry_timestamp: new Date().toISOString(),
          not_before: new Date().toISOString(),
          not_after: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          serial_number: 'fallback-serial-1'
        }
      ];
    }
    
    // Post-processing (if we have certificates from either source)
    if (certificates.length > 0) {
      // Sort by entry timestamp descending (most recent first)
      certificates.sort((a, b) => {
        return new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime();
      });
      
      // Filter out duplicates based on serial number
      const uniqueCerts = new Map();
      certificates = certificates.filter(cert => {
        const duplicate = uniqueCerts.has(cert.serial_number);
        if (!duplicate) {
          uniqueCerts.set(cert.serial_number, true);
        }
        return !duplicate;
      });
      
      // Limit to most recent 50 certificates to keep response size reasonable
      certificates = certificates.slice(0, 50);
    }
    
    // Update statistics
    await updateCertHistoryLookupCount();
    
    // Return the data with a potential warning about using fallback data
    return NextResponse.json({ 
      domain, 
      certificateCount: certificates.length,
      certificates,
      using_fallback: fetchError !== null,
      error_info: fetchError ? 'Data from primary source unavailable. Using fallback data.' : null
    });
  } catch (error) {
    console.error(`Error processing certificate history for domain ${domain}:`, error);
    return NextResponse.json({ 
      error: 'Failed to process certificate history information',
      domain,
      certificateCount: 0,
      certificates: []
    }, { status: 200 }); // Return 200 with empty data instead of 500
  }
} 
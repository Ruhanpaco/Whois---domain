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
    
    // Fetch certificate history from crt.sh (Certificate Transparency Search)
    const response = await axios.get(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`);
    
    let certificates: CertificateInfo[] = [];
    
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
    }
    
    // Update statistics
    await updateCertHistoryLookupCount();
    
    return NextResponse.json({ 
      domain, 
      certificateCount: certificates.length,
      certificates
    });
  } catch (error) {
    console.error(`Error processing certificate history for domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process certificate history information' }, { status: 500 });
  }
} 
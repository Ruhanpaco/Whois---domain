import { NextResponse } from 'next/server';
import whois from 'whois-json';
import { updateWHOISLookupCount } from '@/lib/statistics';

// Function to enhance WHOIS data with additional information
const enhanceWhoisData = (whoisData: any): any => {
  const enhanced = { ...whoisData };
  
  // Fix common issues with WHOIS data
  
  // 1. Map all possible property names to our standardized property names
  const propertyMappings = {
    // Domain information
    domainName: ['domainName', 'domain', 'domain name', 'Domain Name'],
    registrar: ['registrar', 'registrarName', 'Registrar', 'Registrar Name'],
    registrarUrl: ['registrarUrl', 'registrar url', 'Registrar URL'],
    
    // Dates
    creationDate: ['creationDate', 'created', 'Creation Date', 'registrationDate', 'created date', 'Created On'],
    expiryDate: ['expiryDate', 'expires', 'Expiry Date', 'registrarRegistrationExpirationDate', 'expiration date', 'Expiry Date'],
    updatedDate: ['updatedDate', 'changed', 'Updated Date', 'lastModified', 'updated', 'Last Updated'],
    
    // Registrant information
    registrantName: ['registrantName', 'Registrant Name', 'registrant', 'Registrant'],
    registrantOrganization: ['registrantOrganization', 'Registrant Organization', 'registrant org', 'Registrant Org'],
    registrantEmail: ['registrantEmail', 'Registrant Email', 'registrant_email'],
    registrantPhone: ['registrantPhone', 'Registrant Phone', 'registrant_phone'],
    registrantStreet: ['registrantStreet', 'Registrant Street', 'registrant_street', 'registrant address'],
    registrantCity: ['registrantCity', 'Registrant City', 'registrant_city'],
    registrantState: ['registrantState', 'Registrant State/Province', 'registrant_state', 'registrant state'],
    registrantPostalCode: ['registrantPostalCode', 'Registrant Postal Code', 'registrant_zip', 'registrant postal'],
    registrantCountry: ['registrantCountry', 'Registrant Country', 'registrant_country'],
    
    // Admin information
    adminName: ['adminName', 'Admin Name', 'admin', 'Admin', 'administrative contact', 'admin contact'],
    adminOrganization: ['adminOrganization', 'Admin Organization', 'admin org', 'Admin Org'],
    adminEmail: ['adminEmail', 'Admin Email', 'admin_email'],
    adminPhone: ['adminPhone', 'Admin Phone', 'admin_phone'],
    adminCountry: ['adminCountry', 'Admin Country', 'admin_country'],
    
    // Tech information
    techName: ['techName', 'Tech Name', 'technical contact', 'tech contact'],
    techEmail: ['techEmail', 'Tech Email', 'tech_email'],
  };
  
  // Map properties from various possible fields to our standardized field names
  for (const [standardField, possibleFields] of Object.entries(propertyMappings)) {
    if (!enhanced[standardField]) {
      for (const field of possibleFields) {
        if (enhanced[field]) {
          enhanced[standardField] = enhanced[field];
          break;
        }
      }
    }
  }
  
  // 2. Handle status field which can be a string or array
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
  
  // 3. Handle name servers which can be in different fields
  if (!enhanced.nameServers || (Array.isArray(enhanced.nameServers) && enhanced.nameServers.length === 0)) {
    // Look for name servers in other fields
    const nsFields = ['nameServer', 'Name Server', 'nserver', 'ns', 'name servers', 'nameservers'];
    
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
  
  // 4. Clean up date formats if needed
  const dateFields = ['creationDate', 'expiryDate', 'updatedDate'];
  for (const field of dateFields) {
    if (enhanced[field] && typeof enhanced[field] === 'string') {
      // Sometimes dates are in "before:" format or other strange formats
      // Extract the date part if possible
      const dateMatch = enhanced[field].match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
      if (dateMatch) {
        enhanced[field] = dateMatch[0];
      }
      
      // Try to convert to a standard format
      try {
        const date = new Date(enhanced[field]);
        if (!isNaN(date.getTime())) {
          enhanced[field] = date.toISOString();
        }
      } catch (e) {
        // Keep the original if parsing fails
      }
    }
  }
  
  // 5. If we don't have a domain name, extract it from the original request or from other fields
  if (!enhanced.domainName) {
    const possibleFields = ['query', 'domain', 'name', 'Domain Name'];
    for (const field of possibleFields) {
      if (enhanced[field]) {
        enhanced.domainName = enhanced[field];
        break;
      }
    }
  }
  
  return enhanced;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    console.log(`Getting WHOIS data for: ${domain}`);
    
    // Fetch WHOIS data
    const whoisData = await whois(domain);
    
    // Log the raw WHOIS data for debugging
    console.log('Raw WHOIS data:', JSON.stringify(whoisData, null, 2));
    
    // Update WHOIS lookup statistics
    await updateWHOISLookupCount();
    
    // Enhance WHOIS data
    const enhancedData = enhanceWhoisData(whoisData);
    
    // Log the enhanced data for debugging
    console.log('Enhanced WHOIS data:', JSON.stringify(enhancedData, null, 2));
    
    return NextResponse.json({ domain, whoisData: enhancedData });
  } catch (error) {
    console.error(`Error processing WHOIS for domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process WHOIS information' }, { status: 500 });
  }
} 
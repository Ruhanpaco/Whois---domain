import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';
import { updateDNSQueryCount } from '@/lib/statistics';

// Convert DNS methods to promise-based functions
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    console.log(`Getting DNS records for: ${domain}`);
    
    // Get various DNS records in parallel
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
    
    // Update DNS query statistics
    const successfulQueries = Object.keys(records).length;
    await updateDNSQueryCount(successfulQueries);
    
    return NextResponse.json({ domain, dnsRecords: records });
  } catch (error) {
    console.error(`Error processing DNS for domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process DNS information' }, { status: 500 });
  }
} 
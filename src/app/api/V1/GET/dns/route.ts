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
const resolveSrv = promisify(dns.resolveSrv);
const resolvePtr = promisify(dns.resolvePtr);
const resolveNaptr = promisify(dns.resolveNaptr);
const resolveSoa = promisify(dns.resolveSoa);
const resolveCaa = promisify(dns.resolveCaa);
// Additional records - note that some records types like URI, TLSA, SSHFP, SMIMEA, LOC, DNSKEY
// are not directly supported by the Node.js dns module
// We'll add specialized handling for these

// Execute a dig command and parse the output for unsupported record types
async function execDig(domain: string, recordType: string): Promise<any[]> {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const { stdout } = await execPromise(`dig +short ${domain} ${recordType}`);
    if (!stdout.trim()) return [];
    
    return stdout.trim().split('\n').map((line: string) => ({
      name: domain,
      ttl: 3600, // Default TTL
      type: recordType,
      value: line.trim()
    }));
  } catch (e) {
    console.error(`Error executing dig for ${recordType} records:`, e);
    return [];
  }
}

// Add interface for CAA record
interface CaaRecord {
  issuer?: string;
  critical: number;
  flags: number;
  tag: string;
  value: string;
}

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
    
    // Standard record types supported by Node.js dns module
    const recordPromises = [
      // A Records
      resolve4(domain)
        .then(aRecords => {
          records['a'] = aRecords.map(ip => ({
            name: domain,
            ttl: 3600,
            type: 'A',
            value: ip
          }));
        })
        .catch(() => {}),
      
      // AAAA Records
      resolve6(domain)
        .then(aaaaRecords => {
          records['aaaa'] = aaaaRecords.map(ip => ({
            name: domain,
            ttl: 3600,
            type: 'AAAA',
            value: ip
          }));
        })
        .catch(() => {}),
      
      // MX Records
      resolveMx(domain)
        .then(mxRecords => {
          records['mx'] = mxRecords.map(record => ({
            name: domain,
            ttl: 3600,
            type: 'MX',
            priority: record.priority,
            value: record.exchange
          }));
        })
        .catch(() => {}),
      
      // TXT Records
      resolveTxt(domain)
        .then(txtRecords => {
          records['txt'] = txtRecords.map(values => ({
            name: domain,
            ttl: 3600,
            type: 'TXT',
            value: values.join(' ')
          }));
        })
        .catch(() => {}),
      
      // NS Records
      resolveNs(domain)
        .then(nsRecords => {
          records['ns'] = nsRecords.map(server => ({
            name: domain,
            ttl: 3600,
            type: 'NS',
            value: server
          }));
        })
        .catch(() => {}),
      
      // SRV Records
      resolveSrv(domain)
        .then(srvRecords => {
          records['srv'] = srvRecords.map(record => ({
            name: domain,
            ttl: 3600,
            type: 'SRV',
            priority: record.priority,
            weight: record.weight,
            port: record.port,
            value: record.name
          }));
        })
        .catch(() => {}),
      
      // PTR Records
      resolvePtr(domain)
        .then(ptrRecords => {
          records['ptr'] = ptrRecords.map(ptr => ({
            name: domain,
            ttl: 3600,
            type: 'PTR',
            value: ptr
          }));
        })
        .catch(() => {}),
      
      // NAPTR Records
      resolveNaptr(domain)
        .then(naptrRecords => {
          records['naptr'] = naptrRecords.map(record => ({
            name: domain,
            ttl: 3600,
            type: 'NAPTR',
            order: record.order,
            preference: record.preference,
            flags: record.flags,
            service: record.service,
            regexp: record.regexp,
            replacement: record.replacement,
            value: `${record.order} ${record.preference} "${record.flags}" "${record.service}" "${record.regexp}" ${record.replacement}`
          }));
        })
        .catch(() => {}),
      
      // SOA Records
      resolveSoa(domain)
        .then(soaRecord => {
          if (soaRecord) {
            records['soa'] = [{
              name: domain,
              ttl: 3600,
              type: 'SOA',
              nsname: soaRecord.nsname,
              hostmaster: soaRecord.hostmaster,
              serial: soaRecord.serial,
              refresh: soaRecord.refresh,
              retry: soaRecord.retry,
              expire: soaRecord.expire,
              minttl: soaRecord.minttl,
              value: `${soaRecord.nsname} ${soaRecord.hostmaster} ${soaRecord.serial} ${soaRecord.refresh} ${soaRecord.retry} ${soaRecord.expire} ${soaRecord.minttl}`
            }];
          }
        })
        .catch(() => {}),
      
      // CAA Records
      resolveCaa(domain)
        .then((caaRecords: any[]) => {
          records['caa'] = caaRecords.map(record => ({
            name: domain,
            ttl: 3600,
            type: 'CAA',
            flags: record.flags,
            tag: record.tag,
            value: record.value
          }));
        })
        .catch(() => {})
    ];
    
    // Additional record types using dig (if available on server)
    const additionalRecordTypes = ['DNSKEY', 'TLSA', 'SSHFP', 'URI', 'SVCB'];
    const digPromises = additionalRecordTypes.map(recordType => 
      execDig(domain, recordType)
        .then(results => {
          if (results.length > 0) {
            records[recordType.toLowerCase()] = results;
          }
        })
    );
    
    // Wait for all DNS queries to complete
    await Promise.all([...recordPromises, ...digPromises]);
    
    // Update DNS query statistics
    const successfulQueries = Object.keys(records).length;
    await updateDNSQueryCount(successfulQueries);
    
    return NextResponse.json({ domain, dnsRecords: records });
  } catch (error) {
    console.error(`Error processing DNS for domain ${domain}:`, error);
    return NextResponse.json({ error: 'Failed to process DNS information' }, { status: 500 });
  }
} 
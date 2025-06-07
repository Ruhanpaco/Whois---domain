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

// Define interfaces for different DNS record types
interface BaseDnsRecord {
  name: string;
  ttl?: number;
  type: string;
}

interface ARecord extends BaseDnsRecord {
  type: 'A';
  value: string; // IP address
}

interface AAAARecord extends BaseDnsRecord {
  type: 'AAAA';
  value: string; // IPv6 address
}

interface MXRecord extends BaseDnsRecord {
  type: 'MX';
  priority: number;
  value: string; // Mail server
}

interface TXTRecord extends BaseDnsRecord {
  type: 'TXT';
  value: string; // Text content
}

interface NSRecord extends BaseDnsRecord {
  type: 'NS';
  value: string; // Name server
}

interface SRVRecord extends BaseDnsRecord {
  type: 'SRV';
  priority: number;
  weight: number;
  port: number;
  target: string;
  value: string; // Combined representation
}

interface PTRRecord extends BaseDnsRecord {
  type: 'PTR';
  value: string; // Pointer
}

interface NAPTRRecord extends BaseDnsRecord {
  type: 'NAPTR';
  order: number;
  preference: number;
  flags: string;
  service: string;
  regexp: string;
  replacement: string;
  value: string; // Combined representation
}

interface SOARecord extends BaseDnsRecord {
  type: 'SOA';
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
  value: string; // Combined representation
}

interface CAARecord extends BaseDnsRecord {
  type: 'CAA';
  flags: number;
  tag: string;
  value: string;
}

interface GenericRecord extends BaseDnsRecord {
  value: string;
  [key: string]: any; // For additional fields specific to each record type
}

// Execute a dig command and parse the output for unsupported record types
async function execDig(domain: string, recordType: string): Promise<GenericRecord[]> {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const { stdout } = await execPromise(`dig +short ${domain} ${recordType}`);
    if (!stdout.trim()) return [];
    
    // Add proper parsing for specific record types
    switch (recordType) {
      case 'TLSA':
        return stdout.trim().split('\n').map((line: string) => {
          const parts = line.trim().split(' ');
          return {
            name: domain,
            ttl: 3600,
            type: recordType,
            usage: parts[0] ? parseInt(parts[0]) : undefined,
            selector: parts[1] ? parseInt(parts[1]) : undefined,
            matchingType: parts[2] ? parseInt(parts[2]) : undefined,
            certificateData: parts[3] || '',
            value: line.trim()
          };
        });
        
      case 'SSHFP':
        return stdout.trim().split('\n').map((line: string) => {
          const parts = line.trim().split(' ');
          return {
            name: domain,
            ttl: 3600,
            type: recordType,
            algorithm: parts[0] ? parseInt(parts[0]) : undefined,
            fingerprintType: parts[1] ? parseInt(parts[1]) : undefined,
            fingerprint: parts[2] || '',
            value: line.trim()
          };
        });
        
      case 'DNSKEY':
        return stdout.trim().split('\n').map((line: string) => {
          const parts = line.trim().split(' ');
          return {
            name: domain,
            ttl: 3600,
            type: recordType,
            flags: parts[0] ? parseInt(parts[0]) : undefined,
            protocol: parts[1] ? parseInt(parts[1]) : undefined,
            algorithm: parts[2] ? parseInt(parts[2]) : undefined,
            publicKey: parts[3] || '',
            value: line.trim()
          };
        });
        
      case 'URI':
        return stdout.trim().split('\n').map((line: string) => {
          const parts = line.trim().split(' ');
          return {
            name: domain,
            ttl: 3600,
            type: recordType,
            priority: parts[0] ? parseInt(parts[0]) : undefined,
            weight: parts[1] ? parseInt(parts[1]) : undefined,
            target: parts.slice(2).join(' ') || '',
            value: line.trim()
          };
        });
        
      case 'SVCB':
        return stdout.trim().split('\n').map((line: string) => {
          const parts = line.trim().split(' ');
          return {
            name: domain,
            ttl: 3600,
            type: recordType,
            priority: parts[0] ? parseInt(parts[0]) : undefined,
            targetName: parts[1] || '',
            params: parts.slice(2).join(' ') || '',
            value: line.trim()
          };
        });
        
      default:
        return stdout.trim().split('\n').map((line: string) => ({
          name: domain,
          ttl: 3600,
          type: recordType,
          value: line.trim()
        }));
    }
  } catch (e) {
    console.error(`Error executing dig for ${recordType} records:`, e);
    return [];
  }
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
          } as ARecord));
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
          } as AAAARecord));
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
          } as MXRecord));
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
          } as TXTRecord));
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
          } as NSRecord));
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
            target: record.name,
            value: `${record.priority} ${record.weight} ${record.port} ${record.name}`
          } as SRVRecord));
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
          } as PTRRecord));
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
          } as NAPTRRecord));
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
            } as SOARecord];
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
          } as CAARecord));
        })
        .catch(() => {})
    ];
    
    // Additional record types using dig (if available on server)
    const additionalRecordTypes = ['DNSKEY', 'TLSA', 'SSHFP', 'URI', 'SVCB', 'LOC', 'SMIMEA'];
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
    
    return NextResponse.json({ 
      domain, 
      dnsRecords: records,
      recordTypes: Object.keys(records)
    });
  } catch (error) {
    console.error(`Error processing DNS for domain ${domain}:`, error);
    return NextResponse.json({ 
      error: 'Failed to process DNS information',
      domain,
      dnsRecords: {}
    }, { status: 200 }); // Return 200 with empty data instead of 500
  }
} 
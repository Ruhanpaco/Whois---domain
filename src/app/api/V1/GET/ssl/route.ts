import { NextResponse } from 'next/server';
import { updateSSLStats } from '@/lib/statistics';
const { getSSLInfo } = require('@/lib/sslChecker');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const forceRetry = searchParams.get('forceRetry') === 'true';
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    // Only use aggressive settings if explicitly requested via forceRetry
    let sslInfo;
    
    if (forceRetry) {
      console.log(`Using aggressive SSL check for ${domain} (manual retry)`);
      sslInfo = await getSSLInfo(domain, {
        timeout: 8000,    // Longer timeout
        maxRetries: 1,    // One retry
        retryDelay: 1000  // With delay
      });
    } else {
      // Standard settings for all domains (main and subdomains)
      sslInfo = await getSSLInfo(domain, {
        timeout: 4000,
        maxRetries: 0,
        retryDelay: 0
      });
    }
    
    // Update statistics based on SSL validity
    await updateSSLStats(
      sslInfo.valid ? 1 : 0,  // Valid count
      (!sslInfo.valid && !sslInfo.error?.includes('expired')) ? 1 : 0,  // Invalid count
      (sslInfo.error?.includes('expired')) ? 1 : 0  // Expired count
    );
    
    return NextResponse.json({ sslInfo });
  } catch (error) {
    console.error(`Error checking SSL for ${domain}:`, error);
    return NextResponse.json({ 
      error: 'Failed to check SSL certificate', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
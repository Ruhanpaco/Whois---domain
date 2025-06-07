import { NextResponse } from 'next/server';
const { testGlobalPerformance, analyzePerformance } = require('@/lib/geoPerformance');

// Define an interface for request with geo data (available on Vercel)
interface RequestWithGeo extends Request {
  geo?: {
    city?: string;
    country?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const quickMode = searchParams.get('quickMode') === 'true';
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }
  
  try {
    // Set up tracking for the test duration
    const testStartTime = Date.now();
    
    // Log the request for debugging
    console.log(`Starting global performance test for domain: ${domain}`);
    
    // Run global performance tests
    const performanceResults = await testGlobalPerformance(domain);
    
    // Analyze the performance data
    const analysis = analyzePerformance(performanceResults);
    
    // Calculate how long the test took
    const testDuration = Date.now() - testStartTime;
    
    // Add test metadata
    const metadata = {
      testStartTime: new Date(testStartTime).toISOString(),
      testEndTime: new Date().toISOString(),
      testDuration,
      testerIp: request.headers.get('X-Forwarded-For') || 'unknown',
      testerRegion: getRegionFromRequest(request) || 'unknown',
      quickMode
    };
    
    console.log(`Completed global performance test for ${domain} in ${testDuration}ms with ${performanceResults.length} location tests`);
    
    return NextResponse.json({
      domain,
      metadata,
      analysis,
      results: performanceResults
    });
  } catch (error) {
    console.error(`Error running geo-performance tests for ${domain}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to run geo-performance tests', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

/**
 * Extract region information from request headers if available
 * This is mainly available on Vercel or if using a CDN that provides geo headers
 */
function getRegionFromRequest(request: Request): string | null {
  // Try Vercel's headers first (using type assertion)
  const vercelRequest = request as RequestWithGeo;
  if (vercelRequest.geo && vercelRequest.geo.region) {
    return vercelRequest.geo.region;
  }
  
  // Try common CDN headers
  const cloudflareCountry = request.headers.get('CF-IPCountry');
  if (cloudflareCountry) {
    return cloudflareCountry;
  }
  
  const akamiGeo = request.headers.get('X-Akamai-Edgescape');
  if (akamiGeo) {
    // Parse Akamai geo string (format: key1=value1,key2=value2)
    const geoData = akamiGeo.split(',').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    
    return geoData.country_code || geoData.region_code || null;
  }
  
  return null;
} 
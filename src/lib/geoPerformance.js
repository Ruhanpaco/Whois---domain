const { geoLocations, simulateLatency } = require('./geoLocations');
const { getSSLInfo, checkDomainAvailability } = require('./sslChecker');
const https = require('https');
const http = require('http');
const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

// Define regions with known internet restrictions or connectivity issues
const restrictedRegions = {
  'Asia': {
    restrictedDomains: [
      'poe.com', 'facebook.com', 'twitter.com', 'google.com', 'youtube.com', 
      'instagram.com', 'pinterest.com', 'netflix.com', 'medium.com', 'quora.com'
    ],
    restrictionProbability: 0.85, // 85% chance of restriction for known restricted domains
    generalFailureProbability: 0.25, // 25% chance of failure for any domain in this region
    errorMessages: [
      "Connection reset by peer",
      "Connection timed out due to regional network policies",
      "DNS resolution failed - possibly restricted in this region",
      "TLS handshake interrupted"
    ]
  },
  'Middle East': {
    restrictedDomains: [
      'dating.com', 'tinder.com', 'grindr.com', 'okcupid.com', 'bumble.com', 
      'pornhub.com', 'xvideos.com', 'xnxx.com'
    ],
    restrictionProbability: 0.9,
    generalFailureProbability: 0.15,
    errorMessages: [
      "Connection forcibly closed by remote host",
      "TLS handshake failed - connection reset",
      "Connection terminated due to regional access policies",
      "Protocol violation detected by intermediary"
    ]
  },
  'Africa': {
    restrictedDomains: [],
    restrictionProbability: 0,
    generalFailureProbability: 0.4, // Higher general failure rate due to infrastructure issues
    errorMessages: [
      "Connection timed out - possible infrastructure limitations",
      "Intermittent connectivity issues detected",
      "High latency causing connection failures",
      "Packet loss detected in regional network"
    ]
  }
};

// Common domains known to have CDN presence in most regions
const globalCDNDomains = [
  'cloudflare.com', 'akamai.com', 'fastly.com', 'amazon.com', 'microsoft.com', 
  'apple.com', 'cdn.com', 'adobe.com', 'salesforce.com', 'oracle.com'
];

/**
 * Check if domain is likely to be restricted in a specific region
 * @param {string} domain - Domain to check
 * @param {string} region - Region to check restrictions for
 * @returns {Object} Restriction details
 */
function checkRegionalRestrictions(domain, region) {
  if (!restrictedRegions[region]) {
    return { restricted: false, probability: 0 };
  }
  
  // Normalize domain by removing www. prefix, http://, https://, etc.
  const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  // Check if domain is in restricted list
  const isRestricted = restrictedRegions[region].restrictedDomains.some(
    restrictedDomain => normalizedDomain.includes(restrictedDomain)
  );
  
  // Check if domain is likely a CDN with global presence (more reliable)
  const isGlobalCDN = globalCDNDomains.some(
    cdnDomain => normalizedDomain.includes(cdnDomain)
  );
  
  if (isRestricted) {
    return {
      restricted: true,
      probability: restrictedRegions[region].restrictionProbability,
      errorMessage: restrictedRegions[region].errorMessages[
        Math.floor(Math.random() * restrictedRegions[region].errorMessages.length)
      ]
    };
  }
  
  if (isGlobalCDN) {
    // Global CDNs typically have better connectivity even in restricted regions
    return {
      restricted: false,
      probability: restrictedRegions[region].generalFailureProbability * 0.3 // 70% less likely to fail
    };
  }
  
  // General probability for non-restricted, non-CDN domains
  return {
    restricted: false,
    probability: restrictedRegions[region].generalFailureProbability
  };
}

/**
 * Test domain performance from a specific location
 * @param {string} domain - Domain to test
 * @param {string} locationId - Location ID to test from
 * @returns {Promise<Object>} Performance test results
 */
async function testLocationPerformance(domain, locationId) {
  const location = geoLocations.find(loc => loc.id === locationId);
  if (!location) {
    return {
      success: false,
      error: `Location ${locationId} not found`
    };
  }
  
  // Start timing
  const startTime = Date.now();
  
  try {
    // Check if the domain might be restricted in this region
    const regionalRestriction = checkRegionalRestrictions(domain, location.region);
    
    // Apply regional restriction logic
    if (regionalRestriction.restricted) {
      // Domain is in the restricted list for this region
      if (Math.random() < regionalRestriction.probability) {
        // Return a regionally specific failure message
        return {
          success: false,
          location,
          latency: Math.floor(Math.random() * 150) + 50, // Simulate a quick failure (50-200ms)
          error: regionalRestriction.errorMessage || `Connection restricted in ${location.region}`,
          errorType: 'REGIONAL_RESTRICTION',
          errorDetails: `This domain appears to be restricted in ${location.region}`
        };
      }
    } else if (Math.random() < regionalRestriction.probability) {
      // General connectivity issues in the region that aren't domain-specific
      return {
        success: false,
        location,
        latency: Math.floor(Math.random() * 300) + 200, // 200-500ms
        error: restrictedRegions[location.region]?.errorMessages[
          Math.floor(Math.random() * restrictedRegions[location.region]?.errorMessages.length)
        ] || `Intermittent connectivity issues in ${location.region}`,
        errorType: 'REGIONAL_CONNECTIVITY',
        errorDetails: `General connectivity issues detected in ${location.region}`
      };
    }
    
    // Phase 1: DNS Lookup (real)
    const dnsStartTime = Date.now();
    let dnsLookupTime;
    let ipAddress;
    
    try {
      // Perform actual DNS lookup
      const dnsResult = await dnsLookup(domain);
      ipAddress = dnsResult.address;
      dnsLookupTime = Date.now() - dnsStartTime;
    } catch (error) {
      // If DNS lookup fails, return a failure result
      return {
        success: false,
        location,
        latency: Date.now() - startTime,
        error: `DNS lookup failed from ${location.name}`,
        errorType: 'DNS_FAILURE',
        errorDetails: error.message
      };
    }
    
    // Apply a location-based factor to simulate network conditions in different regions
    const locationFactor = Math.max(0.8, Math.min(2.5, (location.latency.min / 50)));
    dnsLookupTime = Math.round(dnsLookupTime * locationFactor);
    
    // Phase 2: HTTP Connection Test (semi-real)
    const connectionStartTime = Date.now();
    let connectionTime;
    let protocol;
    
    // Try HTTPS first
    try {
      // Attempt to connect using HTTPS
      protocol = 'https';
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: domain,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 5000 * locationFactor, // Timeout adjusted by location factor
          rejectUnauthorized: false, // Allow self-signed certificates
        }, (res) => {
          resolve(res);
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timeout'));
        });
        
        req.end();
      });
      
      connectionTime = Date.now() - connectionStartTime;
    } catch (httpsError) {
      try {
        // If HTTPS fails, try HTTP
        protocol = 'http';
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: domain,
            port: 80,
            path: '/',
            method: 'HEAD',
            timeout: 5000 * locationFactor, // Timeout adjusted by location factor
          }, (res) => {
            resolve(res);
          });
          
          req.on('error', (error) => {
            reject(error);
          });
          
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Connection timeout'));
          });
          
          req.end();
        });
        
        connectionTime = Date.now() - connectionStartTime;
      } catch (httpError) {
        // Both HTTPS and HTTP failed
        return {
          success: false,
          location,
          latency: Date.now() - startTime,
          dnsLookupTime,
          error: `Connection failed from ${location.name}`,
          errorType: 'CONNECTION_FAILURE',
          errorDetails: httpError.message,
          ipAddress
        };
      }
    }
    
    // Apply location factor to connection time
    connectionTime = Math.round(connectionTime * locationFactor);
    
    // Phase 3: SSL Verification (if HTTPS)
    let sslVerificationTime = 0;
    let sslInfo = null;
    
    if (protocol === 'https') {
      const sslStartTime = Date.now();
      
      try {
        // Get actual SSL info
        const sslResult = await getSSLInfo(domain);
        sslInfo = sslResult;
        
        if (!sslInfo || !sslInfo.valid) {
          return {
            success: false,
            location,
            latency: Date.now() - startTime,
            dnsLookupTime,
            connectionTime,
            error: `SSL verification failed from ${location.name}`,
            errorType: 'SSL_FAILURE',
            errorDetails: sslInfo?.error || 'Unknown SSL error',
            ipAddress,
            protocol
          };
        }
        
        sslVerificationTime = Date.now() - sslStartTime;
        // Apply location factor to SSL verification time
        sslVerificationTime = Math.round(sslVerificationTime * locationFactor);
      } catch (sslError) {
        return {
          success: false,
          location,
          latency: Date.now() - startTime,
          dnsLookupTime,
          connectionTime,
          error: `SSL verification failed from ${location.name}`,
          errorType: 'SSL_FAILURE',
          errorDetails: sslError.message,
          ipAddress,
          protocol
        };
      }
    }
    
    // Calculate total response time
    const totalTime = Date.now() - startTime;
    
    // Performance rating based on total time and region
    let performanceRating;
    if (totalTime < 300) performanceRating = 'excellent';
    else if (totalTime < 600) performanceRating = 'good';
    else if (totalTime < 1000) performanceRating = 'average';
    else if (totalTime < 1500) performanceRating = 'poor';
    else performanceRating = 'very_poor';
    
    return {
      success: true,
      location,
      latency: totalTime,
      dnsLookupTime,
      connectionTime,
      sslVerificationTime,
      performanceRating,
      ipAddress,
      protocol
    };
  } catch (error) {
    return {
      success: false,
      location,
      latency: Date.now() - startTime,
      error: `Test failed: ${error.message}`,
      errorType: 'TEST_ERROR',
      errorDetails: error.stack
    };
  }
}

/**
 * Test domain performance from all locations
 * @param {string} domain - Domain to test
 * @returns {Promise<Array>} Performance test results from all locations
 */
async function testGlobalPerformance(domain) {
  // Run tests in parallel with a limit of 3 concurrent tests to avoid overwhelming the server
  const results = [];
  const batchSize = 3;
  
  for (let i = 0; i < geoLocations.length; i += batchSize) {
    const batch = geoLocations.slice(i, i + batchSize);
    const batchPromises = batch.map(location => 
      testLocationPerformance(domain, location.id)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches to avoid overloading
    if (i + batchSize < geoLocations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Analyze global performance results and provide insights
 * @param {Array} results - Results from testGlobalPerformance
 * @returns {Object} Performance analysis
 */
function analyzePerformance(results) {
  // Calculate success rate
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length) * 100;
  
  // Find best and worst regions
  const regionPerformance = {};
  
  results.forEach(result => {
    const region = result.location.region;
    if (!regionPerformance[region]) {
      regionPerformance[region] = {
        totalLatency: 0,
        count: 0,
        successCount: 0,
        protocols: {},
        ipAddresses: new Set(),
        errorTypes: {}
      };
    }
    
    regionPerformance[region].count++;
    
    if (result.success) {
      regionPerformance[region].totalLatency += result.latency;
      regionPerformance[region].successCount++;
      
      // Track protocols used
      if (result.protocol) {
        if (!regionPerformance[region].protocols[result.protocol]) {
          regionPerformance[region].protocols[result.protocol] = 0;
        }
        regionPerformance[region].protocols[result.protocol]++;
      }
      
      // Track IP addresses
      if (result.ipAddress) {
        regionPerformance[region].ipAddresses.add(result.ipAddress);
      }
    } else {
      // Track error types
      const errorType = result.errorType || 'UNKNOWN';
      if (!regionPerformance[region].errorTypes[errorType]) {
        regionPerformance[region].errorTypes[errorType] = 0;
      }
      regionPerformance[region].errorTypes[errorType]++;
    }
  });
  
  // Calculate average latency per region and other metrics
  Object.keys(regionPerformance).forEach(region => {
    const rp = regionPerformance[region];
    rp.averageLatency = rp.successCount > 0 
      ? rp.totalLatency / rp.successCount 
      : Infinity;
    rp.successRate = (rp.successCount / rp.count) * 100;
    
    // Convert IP set to array
    rp.ipAddresses = Array.from(rp.ipAddresses);
    
    // Calculate dominant protocol
    rp.dominantProtocol = Object.entries(rp.protocols)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0] || 'unknown';
      
    // Calculate dominant error type (if any)
    if (Object.keys(rp.errorTypes).length > 0) {
      rp.dominantErrorType = Object.entries(rp.errorTypes)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0];
    }
  });
  
  // Find best and worst regions
  let bestRegion = null;
  let worstRegion = null;
  let bestLatency = Infinity;
  let worstLatency = 0;
  
  Object.keys(regionPerformance).forEach(region => {
    const avgLatency = regionPerformance[region].averageLatency;
    if (avgLatency < bestLatency && avgLatency !== Infinity) {
      bestLatency = avgLatency;
      bestRegion = region;
    }
    if (avgLatency > worstLatency && avgLatency !== Infinity) {
      worstLatency = avgLatency;
      worstRegion = region;
    }
  });
  
  // If all regions have Infinity latency, find the one with best success rate
  if (bestRegion === null) {
    let bestSuccessRate = -1;
    Object.keys(regionPerformance).forEach(region => {
      if (regionPerformance[region].successRate > bestSuccessRate) {
        bestSuccessRate = regionPerformance[region].successRate;
        bestRegion = region;
        bestLatency = null; // Set to null to indicate no successful connections
      }
    });
  }
  
  // Find locations with errors
  const failedLocations = results
    .filter(r => !r.success)
    .map(r => ({
      name: r.location.name,
      region: r.location.region,
      error: r.error,
      errorType: r.errorType,
      errorDetails: r.errorDetails
    }));
  
  // Collect all unique IP addresses found
  const allIpAddresses = new Set();
  results.forEach(result => {
    if (result.ipAddress) {
      allIpAddresses.add(result.ipAddress);
    }
  });
  
  // Check for regional restrictions
  const restrictedRegions = [];
  Object.keys(regionPerformance).forEach(region => {
    const rp = regionPerformance[region];
    // If region has very low success rate and high occurrence of REGIONAL_RESTRICTION errors
    if (rp.successRate < 30 && rp.dominantErrorType === 'REGIONAL_RESTRICTION') {
      restrictedRegions.push({
        region,
        successRate: rp.successRate,
        errorTypes: rp.errorTypes
      });
    }
  });
  
  // Get overall performance rating
  let overallRating;
  if (successRate >= 95) overallRating = 'excellent';
  else if (successRate >= 85) overallRating = 'good';
  else if (successRate >= 75) overallRating = 'average';
  else if (successRate >= 60) overallRating = 'poor';
  else overallRating = 'very_poor';
  
  return {
    successRate,
    overallRating,
    bestRegion,
    bestLatency: bestLatency !== Infinity && bestLatency !== null ? Math.round(bestLatency) : null,
    worstRegion,
    worstLatency: worstLatency !== 0 ? Math.round(worstLatency) : null,
    regionPerformance,
    failedLocations,
    ipAddresses: Array.from(allIpAddresses),
    restrictedRegions: restrictedRegions.length > 0 ? restrictedRegions : null
  };
}

module.exports = {
  testLocationPerformance,
  testGlobalPerformance,
  analyzePerformance
}; 
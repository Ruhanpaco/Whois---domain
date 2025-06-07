const https = require('https');
const http = require('http');
const dns = require('dns');
const { promisify } = require('util');
const { TLSSocket } = require('tls');

// Convert DNS methods to promise-based functions
const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

/**
 * Check if a domain is reachable via DNS
 * @param {string} hostname - Domain to check
 * @returns {Promise<{alive: boolean, ip?: string, error?: string}>}
 */
async function checkDomainAvailability(hostname) {
  try {
    // First check DNS
    const result = await dnsLookup(hostname).catch(async (err) => {
      // Try another DNS method if first fails
      return await dnsResolve4(hostname)
        .then(addresses => ({ address: addresses[0] }))
        .catch(() => { throw err; });
    });
    
    return {
      alive: true,
      ip: result.address
    };
  } catch (error) {
    console.log(`DNS lookup failed for ${hostname}: ${error.message}`);
    return {
      alive: false,
      error: `Domain not found: ${error.message}`
    };
  }
}

/**
 * Check if a domain responds to HTTP/HTTPS requests
 * @param {string} hostname - Domain to check
 * @returns {Promise<{alive: boolean, protocol?: string, statusCode?: number, error?: string}>}
 */
async function checkWebAvailability(hostname) {
  // Try HTTPS first, then fallback to HTTP
  try {
    console.log(`Trying HTTPS for ${hostname}...`);
    const result = await checkProtocol(hostname, 'https');
    console.log(`HTTPS check successful for ${hostname}, status: ${result.statusCode}`);
    return result;
  } catch (error) {
    console.log(`HTTPS check failed for ${hostname}, trying HTTP: ${error.message}`);
    
    try {
      const result = await checkProtocol(hostname, 'http');
      console.log(`HTTP check successful for ${hostname}, status: ${result.statusCode}`);
      return result;
    } catch (httpError) {
      console.log(`HTTP check also failed for ${hostname}: ${httpError.message}`);
      
      // Special case: if both HTTP and HTTPS fail but DNS works, 
      // we'll still consider the site "alive" but with protocol unknown
      // This allows SSL checking to proceed for sites that have SSL but might block HEAD requests
      return {
        alive: true,
        protocol: 'https', // Assume HTTPS for SSL check purposes
        statusCode: 0,
        warning: `Website did not respond to HTTP/HTTPS probe: ${httpError.message}, but DNS is valid`
      };
    }
  }
}

/**
 * Helper function to check if a domain responds to a specific protocol
 * @private
 */
async function checkProtocol(hostname, protocol) {
  return new Promise((resolve, reject) => {
    const client = protocol === 'https' ? https : http;
    const options = {
      hostname,
      port: protocol === 'https' ? 443 : 80,
      path: '/',
      method: 'HEAD',
      timeout: 2000, // Reduced from 3000 to 2000ms (2 seconds)
      rejectUnauthorized: false // Allow self-signed certificates
    };
    
    const req = client.request(options, (res) => {
      // Immediately consume and discard response data to free up resources
      res.resume();
      resolve({
        alive: true,
        protocol,
        statusCode: res.statusCode
      });
    });
    
    req.on('error', (err) => {
      req.destroy(); // Ensure connection is closed on error
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
    
    req.end();
  });
}

/**
 * Get SSL certificate information for a domain
 * @param {Object} socket - TLS Socket
 * @returns {Object} Certificate information
 */
function parseCertificate(socket) {
  if (!socket || !socket.getPeerCertificate) {
    return { valid: false, error: 'No secure connection established' };
  }

  const cert = socket.getPeerCertificate(true);
  
  // Check if the certificate object is empty (no properties except maybe issuerCertificate)
  if (!cert || Object.keys(cert).length < 2) {
    return { valid: false, error: 'No SSL certificate found' };
  }
  
  // Check if certificate is actually present with required fields
  if (!cert.subject || !cert.issuer || !cert.valid_from || !cert.valid_to) {
    return { valid: false, error: 'Invalid or incomplete SSL certificate' };
  }

  // Calculate days remaining
  const validTo = new Date(cert.valid_to);
  const now = new Date();
  const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

  // Create the sslInfo object with certificate details
  const sslInfo = {
    valid: socket.authorized,
    error: socket.authorized ? undefined : socket.authorizationError,
    issuer: cert.issuer.O || cert.issuer.CN,
    subject: cert.subject.CN,
    validFrom: cert.valid_from,
    validTo: cert.valid_to,
    daysRemaining: daysRemaining,
    protocol: socket.getProtocol ? socket.getProtocol() : undefined,
    cipher: socket.getCipher ? socket.getCipher().name : undefined,
    serialNumber: cert.serialNumber,
    fingerprint: cert.fingerprint,
    issuerDetails: cert.issuer,
  };

  return sslInfo;
}

/**
 * Attempt to get SSL certificate from a domain with HTTPS
 * @private
 */
function attemptSSLCheck(hostname, options = {}) {
  return new Promise((resolve, reject) => {
    // Check if hostname includes protocol, if so, strip it
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      hostname = hostname.replace(/^https?:\/\//, '');
    }
    
    const req = https.request({
      hostname,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: options.timeout || 5000, // 5 second timeout by default
      agent: false, // Don't use connection pooling
      rejectUnauthorized: false, // Accept self-signed certificates for checking
      headers: {
        'Connection': 'close' // Tell server to close connection after response
      }
    });

    // Listen for socket to inspect certificate
    req.on('socket', socket => {
      socket.on('secureConnect', () => {
        if (socket instanceof TLSSocket) {
          const sslInfo = parseCertificate(socket);
          
          // Add extra debug info if certificate is found but invalid
          if (!sslInfo.valid && !sslInfo.error.includes('No SSL certificate found')) {
            console.log(`SSL certificate found for ${hostname} but invalid: ${sslInfo.error}`);
          }
          
          // Force close socket after we get the info
          try {
            socket.end();
            socket.destroy();
          } catch (e) {
            console.error(`Error closing socket for ${hostname}:`, e.message);
          }
          
          resolve(sslInfo);
        } else {
          reject(new Error('Connection is not secure'));
        }
      });
    });

    // Set up response handler to detect redirects and capture status codes
    req.on('response', (res) => {
      // Check for redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Detected redirect for ${hostname} to ${res.headers.location}`);
        
        // If this is a redirect to the same hostname but with https, try following it
        const redirectUrl = new URL(
          res.headers.location.startsWith('http') 
            ? res.headers.location 
            : `https://${hostname}${res.headers.location}`
        );
        
        // Only follow redirects to the same hostname or www variants
        if (redirectUrl.hostname === hostname || 
            redirectUrl.hostname === `www.${hostname}` || 
            hostname === `www.${redirectUrl.hostname}`) {
          
          console.log(`Following redirect from ${hostname} to ${redirectUrl.hostname}`);
          
          // Try the new hostname
          attemptSSLCheck(redirectUrl.hostname, options)
            .then(resolve)
            .catch(reject);
        } else {
          // Different domain redirect, just return basic info
          console.log(`Redirect to different domain: ${redirectUrl.hostname}, not following`);
          resolve({
            valid: false,
            error: `Redirects to different domain: ${redirectUrl.hostname}`,
            redirectTo: redirectUrl.href
          });
        }
      } else {
        // For non-redirect responses, consume data to free up memory
        res.resume();
      }
    });

    // Handle errors
    req.on('error', error => {
      let errorMessage = error.message;

      // Enhance error messages for common issues
      if (error.code === 'ECONNRESET') {
        errorMessage = 'Connection was reset by the server';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found';
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Connection timed out';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      }

      reject(new Error(errorMessage));
    });

    // Handle timeout
    req.on('timeout', () => {
      req.destroy(new Error('Connection timed out'));
    });

    // End request
    req.end();
  });
}

/**
 * Get SSL certificate information with automatic retry
 * @param {string} hostname - Domain to check
 * @param {Object} options - Options for SSL check
 * @returns {Promise<Object>} SSL certificate information
 */
async function getSSLInfo(hostname, options = {}) {
  console.log(`Getting SSL info for: ${hostname} (max retries: ${options.maxRetries || 0})`);
  
  // Check if domain is available first
  const availability = await checkDomainAvailability(hostname);
  if (!availability.alive) {
    return {
      valid: false,
      error: `Domain is not available: ${availability.error || 'DNS lookup failed'}`,
      ip: availability.ip // Include IP if available
    };
  }
  
  // Check if the site is accessible via HTTP/HTTPS
  let webCheck;
  try {
    webCheck = await checkWebAvailability(hostname);
  } catch (error) {
    console.log(`Web availability check failed for ${hostname}: ${error.message}`);
    // Even if web check fails, continue with SSL check since some servers might block HEAD requests
    webCheck = { alive: false, error: error.message };
  }
  
  try {
    // Use the new attemptSSLCheck function for better certificate validation
    const sslInfo = await attemptSSLCheck(hostname, options);
    
    // Add IP address from availability check to the result
    return {
      ...sslInfo,
      ip: availability.ip
    };
  } catch (error) {
    // If first attempt fails, try retrying if configured
    const maxRetries = options.maxRetries || 0;
    const retryDelay = options.retryDelay || 1000;
    
    if (maxRetries > 0) {
      console.log(`SSL check failed for ${hostname}, retrying... (${error.message})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Retry with one less retry
      return getSSLInfo(hostname, {
        ...options,
        maxRetries: maxRetries - 1
      });
    }
    
    // If no web check succeeded, add that info to the error
    if (!webCheck.alive) {
      return {
        valid: false,
        error: `Unable to establish a secure connection: ${error.message}`,
        webError: webCheck.error,
        ip: availability.ip
      };
    }
    
    // If HTTP works but HTTPS doesn't, the site might be HTTP only
    if (webCheck.alive && webCheck.protocol === 'http') {
      return {
        valid: false,
        error: 'Site is HTTP only, no SSL certificate available',
        httpOnly: true,
        ip: availability.ip
      };
    }
    
    return {
      valid: false,
      error: `SSL certificate error: ${error.message}`,
      ip: availability.ip
    };
  }
}

module.exports = {
  getSSLInfo,
  checkDomainAvailability,
  checkWebAvailability
}; 
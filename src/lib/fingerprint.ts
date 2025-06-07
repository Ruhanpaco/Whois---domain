import crypto from 'crypto';

/**
 * Hashes a string using SHA-256 algorithm
 */
export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Hashes an IP address for secure storage
 */
export function hashIpAddress(ip: string): string {
  // Use a secure salt - in production this should be an environment variable
  const salt = process.env.IP_HASH_SALT || 'default-secure-salt-4d1a2b3c'; // Temporary fallback
  return hashString(`${ip}${salt}`);
}

/**
 * Creates a secure device fingerprint from user agent and other browser attributes
 * This is a simplified version - in production you might use a more sophisticated fingerprinting library
 */
export function generateFingerprint(userAgent: string, additionalData: string = ''): string {
  // Temporary fallback - in production, use environment variables
  const salt = process.env.FINGERPRINT_SALT || 'default-fingerprint-salt-5e6f7g8h';
  return hashString(`${userAgent}${additionalData}${salt}`);
}

/**
 * Encrypts vote data for client-side storage
 */
export function encryptVoteData(featureIds: string[]): string {
  try {
    // In production, use a proper encryption method with a secure key
    // This is a simplified version using base64 encoding
    const data = JSON.stringify({
      v: featureIds,
      t: Date.now() // Add timestamp to prevent tampering
    });
    
    // Simple XOR encryption with a key (very basic, use proper encryption in production)
    // Temporary fallback - in production, use environment variables
    const key = process.env.VOTE_ENCRYPTION_KEY || 'default-encryption-key-9i0j1k2l';

    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return Buffer.from(result).toString('base64');
  } catch (error) {
    console.error('Error encrypting vote data:', error);
    return '';
  }
}

/**
 * Decrypts vote data from client-side storage
 */
export function decryptVoteData(encryptedData: string): string[] {
  try {
    if (!encryptedData) return [];
    
    // Decode base64
    const decoded = Buffer.from(encryptedData, 'base64').toString();
    
    // Simple XOR decryption with the same key
    // Temporary fallback - in production, use environment variables
    const key = process.env.VOTE_ENCRYPTION_KEY || 'default-encryption-key-9i0j1k2l';
    
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    const data = JSON.parse(result);
    
    // Validate timestamp to prevent replay attacks (e.g., expires after 30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.t > thirtyDaysMs) {
      return []; // Expired
    }
    
    return data.v;
  } catch (error) {
    console.error('Error decrypting vote data:', error);
    return [];
  }
} 
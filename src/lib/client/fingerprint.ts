'use client';

import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

// Create a singleton instance to avoid multiple initializations
let fpPromise: Promise<FingerprintJS.Agent> | null = null;

/**
 * Initialize the fingerprint agent if not already initialized
 */
export const getFingerprint = async (): Promise<string> => {
  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    
    const fp = await fpPromise;
    const result = await fp.get();
    
    // Return the visitor identifier
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    
    // Fallback to a simpler fingerprint if the library fails
    const fallbackData = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth
    ].join('|');
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fallbackData.length; i++) {
      const char = fallbackData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }
};

/**
 * Store encrypted voted feature IDs in localStorage
 */
export const storeVotedFeatures = (encryptedData: string): void => {
  try {
    localStorage.setItem('domaininfo_votes', encryptedData);
  } catch (error) {
    console.error('Error storing voted features:', error);
  }
};

/**
 * Retrieve encrypted voted feature IDs from localStorage
 */
export const getStoredVotedFeatures = (): string => {
  try {
    return localStorage.getItem('domaininfo_votes') || '';
  } catch (error) {
    console.error('Error retrieving voted features:', error);
    return '';
  }
};

/**
 * Clear stored votes (for testing purposes only)
 */
export const clearStoredVotes = (): void => {
  try {
    localStorage.removeItem('domaininfo_votes');
  } catch (error) {
    console.error('Error clearing voted features:', error);
  }
}; 
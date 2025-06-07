import mongoose from 'mongoose';
import StatisticsModel from './models/StatisticsModel';
import { connectToDatabase } from './mongodb';

// Connect to MongoDB using Mongoose
export const connectMongoose = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      // Get MongoDB URI from our connection utility
      await connectToDatabase();
      // Use fixed URI as fallback
      const uri = 'mongodb+srv://whoisdomainRPaco:UvBGlp8KOJEWjuRa@domainwhoisrp.bt0xapj.mongodb.net/?retryWrites=true&w=majority&appName=DomainWhoisRP';
      
      // Connect using Mongoose
      await mongoose.connect(uri, {
        dbName: 'domain_info'
      });
      
      console.log('Mongoose connected successfully');
    } catch (error) {
      console.error('Mongoose connection error:', error);
    }
  }
};

// Initialize statistics record if it doesn't exist
export const initializeStatistics = async () => {
  await connectMongoose();
  
  try {
    // Find or create the statistics document
    let stats = await StatisticsModel.findOne({});
    
    if (!stats) {
      stats = new StatisticsModel();
      await stats.save();
      console.log('Statistics initialized');
    }
    
    return stats;
  } catch (error) {
    console.error('Error initializing statistics:', error);
    return null;
  }
};

// Encode domain for MongoDB Map key (replacing dots with underscores)
const encodeDomainKey = (domain: string): string => {
  return domain.replace(/\./g, '_DOT_');
};

// Decode domain from MongoDB Map key back to original form
const decodeDomainKey = (key: string): string => {
  return key.replace(/_DOT_/g, '.');
};

// Update search count for a domain
export const updateDomainSearch = async (domain: string) => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    // Increment total searches
    stats.totalSearches += 1;
    
    // Encode domain name to avoid dots in keys
    const encodedDomain = encodeDomainKey(domain);
    
    // Update domain-specific count
    const searchedDomains = stats.searchedDomains || new Map();
    const currentCount = searchedDomains.get(encodedDomain) || 0;
    searchedDomains.set(encodedDomain, currentCount + 1);
    stats.searchedDomains = searchedDomains;
    
    // Extract and update TLD statistics
    const tld = domain.split('.').pop()?.toLowerCase();
    if (tld) {
      const tldStats = stats.tldStatistics || new Map();
      const currentTldCount = tldStats.get(tld) || 0;
      tldStats.set(tld, currentTldCount + 1);
      stats.tldStatistics = tldStats;
    }
    
    // Update searches by day
    const today = new Date().toISOString().split('T')[0];
    const searchesByDay = stats.searchesByDay || new Map();
    const todayCount = searchesByDay.get(today) || 0;
    searchesByDay.set(today, todayCount + 1);
    stats.searchesByDay = searchesByDay;
    
    // Update top domains (keep top 10)
    const domainEntries: [string, number][] = [];
    searchedDomains.forEach((count: number, key: string) => {
      // Decode the domain name back to its original form with dots
      const originalDomain = decodeDomainKey(key);
      domainEntries.push([originalDomain, count]);
    });
    
    const topDomains = domainEntries
      .map(entry => ({ domain: entry[0], count: entry[1] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    stats.topSearchedDomains = topDomains;
    stats.lastUpdated = new Date();
    
    await stats.save();
    console.log(`Statistics updated for domain: ${domain}`);
  } catch (error) {
    console.error('Error updating domain search statistics:', error);
  }
};

// Update subdomain discovery statistics
export const updateSubdomainStats = async (domain: string, subdomainCount: number) => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    // Increment total subdomains discovered
    stats.totalSubdomainsDiscovered += subdomainCount;
    
    // Recalculate average subdomains per domain
    const totalDomains = stats.searchedDomains ? stats.searchedDomains.size : 0;
    if (totalDomains > 0) {
      stats.averageSubdomainsPerDomain = stats.totalSubdomainsDiscovered / totalDomains;
    }
    
    stats.lastUpdated = new Date();
    await stats.save();
    console.log(`Subdomain statistics updated for domain: ${domain}, count: ${subdomainCount}`);
  } catch (error) {
    console.error('Error updating subdomain statistics:', error);
  }
};

// Update SSL check statistics
export const updateSSLStats = async (validCount: number, invalidCount: number, expiredCount: number) => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    // Increment SSL checks count
    stats.totalSSLChecks += (validCount + invalidCount + expiredCount);
    
    // Update SSL statistics
    stats.sslStatistics.valid += validCount;
    stats.sslStatistics.invalid += invalidCount;
    stats.sslStatistics.expired += expiredCount;
    
    stats.lastUpdated = new Date();
    await stats.save();
    console.log(`SSL statistics updated`);
  } catch (error) {
    console.error('Error updating SSL statistics:', error);
  }
};

// Update DNS query count
export const updateDNSQueryCount = async (count: number) => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    stats.totalDNSQueries += count;
    stats.lastUpdated = new Date();
    await stats.save();
    console.log(`DNS query count updated: +${count}`);
  } catch (error) {
    console.error('Error updating DNS query count:', error);
  }
};

// Update WHOIS lookup count
export const updateWHOISLookupCount = async () => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    stats.totalWHOISLookups += 1;
    stats.lastUpdated = new Date();
    await stats.save();
    console.log(`WHOIS lookup count updated`);
  } catch (error) {
    console.error('Error updating WHOIS lookup count:', error);
  }
};

// Update certificate history lookup count
export const updateCertHistoryLookupCount = async () => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    if (!stats) return;
    
    stats.totalCertHistoryLookups += 1;
    stats.lastUpdated = new Date();
    await stats.save();
    console.log(`Certificate history lookup count updated`);
  } catch (error) {
    console.error('Error updating certificate history lookup count:', error);
  }
};

// Get all statistics
export const getStatistics = async () => {
  await connectMongoose();
  
  try {
    const stats = await initializeStatistics();
    return stats;
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
}; 
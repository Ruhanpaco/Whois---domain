import { NextResponse } from 'next/server';
import { getStatistics } from '@/lib/statistics';

// Helper function to decode domain keys back to normal domain format
const decodeDomainKey = (key: string): string => {
  return key.replace(/_DOT_/g, '.');
};

export async function GET() {
  try {
    // Get statistics from the database
    const stats = await getStatistics();
    
    // If stats couldn't be retrieved, return some initial data
    if (!stats) {
      return NextResponse.json({
        totalSearches: 0,
        totalDNSQueries: 0,
        totalSSLChecks: 0,
        totalWHOISLookups: 0,
        totalSubdomainsDiscovered: 0,
        topSearchedDomains: [],
        tldStatistics: {},
        sslStatistics: {
          valid: 0,
          invalid: 0,
          expired: 0
        },
        searchesByDay: {},
        averageSubdomainsPerDomain: 0
      });
    }
    
    // Transform Map objects for proper JSON serialization
    const tldStats: Record<string, number> = {};
    if (stats.tldStatistics) {
      for (const [key, value] of Object.entries(stats.tldStatistics.toJSON())) {
        tldStats[key] = value as number;
      }
    }
    
    // Process searched domains and decode domain names
    const searchedDomains: Record<string, number> = {};
    if (stats.searchedDomains) {
      for (const [key, value] of Object.entries(stats.searchedDomains.toJSON())) {
        // Decode the domain key back to normal domain format with dots
        const originalDomain = decodeDomainKey(key);
        searchedDomains[originalDomain] = value as number;
      }
    }
    
    const searchesByDay: Record<string, number> = {};
    if (stats.searchesByDay) {
      for (const [key, value] of Object.entries(stats.searchesByDay.toJSON())) {
        searchesByDay[key] = value as number;
      }
    }
    
    // Return the statistics data with transformed Maps
    return NextResponse.json({
      totalSearches: stats.totalSearches || 0,
      totalDNSQueries: stats.totalDNSQueries || 0,
      totalSSLChecks: stats.totalSSLChecks || 0,
      totalWHOISLookups: stats.totalWHOISLookups || 0,
      totalSubdomainsDiscovered: stats.totalSubdomainsDiscovered || 0,
      topSearchedDomains: stats.topSearchedDomains || [],
      searchedDomains: searchedDomains,
      tldStatistics: tldStats,
      sslStatistics: stats.sslStatistics || {
        valid: 0,
        invalid: 0,
        expired: 0
      },
      searchesByDay: searchesByDay,
      averageSubdomainsPerDomain: stats.averageSubdomainsPerDomain || 0,
      lastUpdated: stats.lastUpdated || new Date()
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 
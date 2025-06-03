import { NextResponse } from 'next/server';
import { getStatistics } from '@/lib/statistics';

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
      });
    }
    
    // Return the statistics data
    return NextResponse.json({
      totalSearches: stats.totalSearches || 0,
      totalDNSQueries: stats.totalDNSQueries || 0,
      totalSSLChecks: stats.totalSSLChecks || 0,
      totalWHOISLookups: stats.totalWHOISLookups || 0,
      totalSubdomainsDiscovered: stats.totalSubdomainsDiscovered || 0,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 
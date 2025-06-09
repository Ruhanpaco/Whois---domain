'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaNetworkWired, FaLock, FaServer, FaGlobe, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';

interface StatisticItem {
  icon: React.ReactNode;
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export default function StatisticsCounter() {
  const [stats, setStats] = useState<{
    totalSearches: number;
    totalDNSQueries: number;
    totalSSLChecks: number;
    totalWHOISLookups: number;
    totalSubdomainsDiscovered: number;
    sslStatistics?: {
      valid: number;
      invalid: number;
      expired: number;
    };
    averageSubdomainsPerDomain?: number;
    lastUpdated?: string;
  }>({
    totalSearches: 0,
    totalDNSQueries: 0,
    totalSSLChecks: 0,
    totalWHOISLookups: 0,
    totalSubdomainsDiscovered: 0,
    sslStatistics: {
      valid: 0,
      invalid: 0,
      expired: 0
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/V1/GET/statistics');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setError(null);
        } else {
          setError('Failed to fetch statistics');
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Error connecting to statistics service');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Fetch data every 30 seconds to keep it updated but not too frequently
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const mainStatisticsItems: StatisticItem[] = [
    {
      icon: <FaSearch className="text-green-500" />,
      title: 'Total Searches',
      value: stats.totalSearches,
      prefix: '',
    },
    {
      icon: <FaNetworkWired className="text-green-500" />,
      title: 'DNS Queries',
      value: stats.totalDNSQueries,
      prefix: '',
    },
    {
      icon: <FaLock className="text-green-500" />,
      title: 'SSL Checks',
      value: stats.totalSSLChecks,
      prefix: '',
    },
    {
      icon: <FaServer className="text-green-500" />,
      title: 'WHOIS Lookups',
      value: stats.totalWHOISLookups,
      prefix: '',
    },
    {
      icon: <FaGlobe className="text-green-500" />,
      title: 'Subdomains Found',
      value: stats.totalSubdomainsDiscovered,
      prefix: '',
    },
  ];

  const sslStatisticsItems: StatisticItem[] = [
    {
      icon: <FaCheckCircle className="text-green-500" />,
      title: 'Valid Certificates',
      value: stats.sslStatistics?.valid || 0,
      color: 'green',
    },
    {
      icon: <FaTimesCircle className="text-red-500" />,
      title: 'Invalid Certificates',
      value: stats.sslStatistics?.invalid || 0,
      color: 'red',
    },
    {
      icon: <FaExclamationTriangle className="text-yellow-500" />,
      title: 'Expired Certificates',
      value: stats.sslStatistics?.expired || 0,
      color: 'yellow',
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-900/70 rounded-md border border-red-500/30 p-4 mt-6">
        <div className="text-red-400 text-center">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/70 rounded-md border border-green-500/30 p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-xs text-gray-400">
          <FaServer className="mr-2 text-green-500" />
          <span>Global System Statistics</span>
        </div>
        <div className="text-xs text-gray-400 flex items-center">
          <FaCalendarAlt className="mr-1 text-green-500" />
          <span>Last updated: {formatDate(stats.lastUpdated)}</span>
        </div>
      </div>
      
      {/* Main statistics grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {mainStatisticsItems.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-black/40 p-3 rounded border border-green-500/20 hover:border-green-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              {item.icon}
              <div className="text-green-400 font-mono text-lg">
                {item.prefix}{item.value.toLocaleString()}{item.suffix}
              </div>
            </div>
            <div className="text-xs text-gray-400">{item.title}</div>
          </motion.div>
        ))}
      </div>
      
      {/* SSL statistics */}
      <div className="mt-4 mb-2">
        <div className="text-xs text-gray-400 mb-2 border-b border-gray-700 pb-2">SSL Certificate Analysis</div>
        <div className="grid grid-cols-3 gap-4">
          {sslStatisticsItems.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 5) }}
              className={`bg-black/40 p-3 rounded border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-colors`}
            >
              <div className="flex items-center justify-between mb-2">
                {item.icon}
                <div className={`text-${item.color}-400 font-mono text-lg`}>
                  {item.value.toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-gray-400">{item.title}</div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Additional stats */}
      {stats.averageSubdomainsPerDomain !== undefined && (
        <div className="mt-4 p-3 bg-black/40 rounded border border-green-500/20">
          <div className="text-xs text-gray-400">Average Subdomains per Domain</div>
          <div className="text-green-400 font-mono text-lg mt-1">
            {stats.averageSubdomainsPerDomain.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
} 
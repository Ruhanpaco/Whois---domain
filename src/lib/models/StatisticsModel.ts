import mongoose from 'mongoose';

// Define the schema for the statistics
const StatisticsSchema = new mongoose.Schema({
  // Total counts
  totalSearches: {
    type: Number,
    default: 0
  },
  totalSubdomainsDiscovered: {
    type: Number,
    default: 0
  },
  totalSSLChecks: {
    type: Number,
    default: 0
  },
  totalDNSQueries: {
    type: Number,
    default: 0
  },
  totalWHOISLookups: {
    type: Number,
    default: 0
  },
  totalCertHistoryLookups: {
    type: Number,
    default: 0
  },
  
  // Domain statistics
  searchedDomains: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Top domains by search count
  topSearchedDomains: [{
    domain: String,
    count: Number
  }],
  
  // Domain TLD statistics
  tldStatistics: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // SSL statistics
  sslStatistics: {
    valid: {
      type: Number,
      default: 0
    },
    invalid: {
      type: Number,
      default: 0
    },
    expired: {
      type: Number,
      default: 0
    }
  },
  
  // Subdomain statistics
  averageSubdomainsPerDomain: {
    type: Number,
    default: 0
  },
  
  // Time-based statistics
  searchesByDay: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
export default mongoose.models.Statistics || mongoose.model('Statistics', StatisticsSchema); 
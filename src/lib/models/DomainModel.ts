import mongoose from 'mongoose';

// Define the schema for the domain information
const DomainSchema = new mongoose.Schema({
  domainName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  whoisData: {
    type: Object,
    default: null
  },
  dnsRecords: {
    type: Object,
    default: null
  },
  sslInfo: {
    type: Object,
    default: null
  },
  subdomains: {
    type: Array,
    default: []
  },
  emailData: {
    type: Object,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
// Use mongoose.models to check if the model already exists to avoid the "OverwriteModelError"
export default mongoose.models.Domain || mongoose.model('Domain', DomainSchema); 
/**
 * Geographic locations for testing domain performance
 * These represent different regions around the world
 */
const geoLocations = [
  {
    id: 'us-east',
    name: 'US East (Virginia)',
    region: 'North America',
    emoji: '🇺🇸',
    testServer: '54.236.254.134',
    latency: { min: 30, max: 90 } // Simulated latency range in ms
  },
  {
    id: 'us-west',
    name: 'US West (California)',
    region: 'North America',
    emoji: '🇺🇸',
    testServer: '52.9.133.180',
    latency: { min: 40, max: 120 }
  },
  {
    id: 'eu-central',
    name: 'Europe (Frankfurt)',
    region: 'Europe',
    emoji: '🇩🇪',
    testServer: '3.122.203.196',
    latency: { min: 80, max: 160 }
  },
  {
    id: 'eu-west',
    name: 'Europe (Ireland)',
    region: 'Europe',
    emoji: '🇮🇪',
    testServer: '34.242.129.59',
    latency: { min: 90, max: 170 }
  },
  {
    id: 'ap-south',
    name: 'Asia Pacific (Mumbai)',
    region: 'Asia',
    emoji: '🇮🇳',
    testServer: '13.235.35.77',
    latency: { min: 220, max: 350 }
  },
  {
    id: 'ap-southeast',
    name: 'Asia Pacific (Singapore)',
    region: 'Asia',
    emoji: '🇸🇬',
    testServer: '54.255.174.111',
    latency: { min: 180, max: 300 }
  },
  {
    id: 'ap-northeast',
    name: 'Asia Pacific (Tokyo)',
    region: 'Asia',
    emoji: '🇯🇵',
    testServer: '54.64.73.31',
    latency: { min: 140, max: 270 }
  },
  {
    id: 'sa-east',
    name: 'South America (São Paulo)',
    region: 'South America',
    emoji: '🇧🇷',
    testServer: '54.207.7.220',
    latency: { min: 150, max: 280 }
  },
  {
    id: 'af-south',
    name: 'Africa (Cape Town)',
    region: 'Africa',
    emoji: '🇿🇦',
    testServer: '13.244.241.80',
    latency: { min: 240, max: 380 }
  },
  {
    id: 'me-south',
    name: 'Middle East (Bahrain)',
    region: 'Middle East',
    emoji: '🇧🇭',
    testServer: '15.185.141.105',
    latency: { min: 200, max: 320 }
  },
  {
    id: 'ap-east',
    name: 'Asia Pacific (Hong Kong)',
    region: 'Asia',
    emoji: '🇭🇰',
    testServer: '18.166.173.252',
    latency: { min: 170, max: 290 }
  },
  {
    id: 'au-east',
    name: 'Australia (Sydney)',
    region: 'Oceania',
    emoji: '🇦🇺',
    testServer: '54.66.65.201',
    latency: { min: 190, max: 310 }
  }
];

/**
 * Simulate latency for different regions of the world
 * @param {string} locationId - ID of the location to test
 * @returns {number} Simulated latency in milliseconds
 */
function simulateLatency(locationId) {
  const location = geoLocations.find(loc => loc.id === locationId);
  if (!location) return 100; // Default latency if location not found
  
  const { min, max } = location.latency;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Group locations by region
 * @returns {Object} Locations grouped by region
 */
function getLocationsByRegion() {
  return geoLocations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = [];
    }
    acc[location.region].push(location);
    return acc;
  }, {});
}

module.exports = {
  geoLocations,
  simulateLatency,
  getLocationsByRegion
}; 
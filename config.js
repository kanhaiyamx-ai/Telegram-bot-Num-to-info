// Bot Configuration
// All sensitive values should be set via environment variables

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const LOOKUP_API = process.env.LOOKUP_API || 'https://killer-proxy-api.vercel.app/api/info?number=';
const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || '@SNIPESUBZ';

// Required channel IDs for force-join verification
const REQUIRED_CHANNELS = [
  -1003636897874,
  -1002211354038,
  -1002977379092
];

// Channel links for join buttons
const CHANNEL_LINKS = [
  { id: -1003636897874, name: 'Channel 1', link: 'https://t.me/+CsuWMxnB9l81MDM1' },
  { id: -1002211354038, name: 'Channel 2', link: 'https://t.me/+MJGAHYX0H_g1YTJl' },
  { id: -1002977379092, name: 'Channel 3', link: 'https://t.me/+R7WSbWgoxi9kYzFl' }
];

// Validate required environment variables
function validateConfig() {
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
  }
  if (!ADMIN_ID) {
    throw new Error('ADMIN_ID environment variable is required');
  }
}

module.exports = {
  BOT_TOKEN,
  ADMIN_ID,
  LOOKUP_API,
  SUPPORT_CONTACT,
  REQUIRED_CHANNELS,
  CHANNEL_LINKS,
  validateConfig
};

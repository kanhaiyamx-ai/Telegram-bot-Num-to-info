// Bot Configuration - Lightweight module for fast cold starts

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

// Performance settings
const API_TIMEOUT = 5000;           // 5 second timeout
const CACHE_DURATION = 600000;      // 10 minutes cache
const RATE_LIMIT_WINDOW = 60000;    // 1 minute window
const RATE_LIMIT_MAX = 5;           // 5 requests per window

module.exports = {
  BOT_TOKEN,
  ADMIN_ID,
  LOOKUP_API,
  SUPPORT_CONTACT,
  REQUIRED_CHANNELS,
  CHANNEL_LINKS,
  API_TIMEOUT,
  CACHE_DURATION,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX
};

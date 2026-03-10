#!/usr/bin/env node

/**
 * Script to run the bot locally using polling mode
 * 
 * Usage:
 *   node scripts/local-polling.js
 * 
 * Note: Make sure to delete the webhook before using polling:
 *   curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"
 */

require('dotenv').config();

const { validateConfig } = require('../lib/config');
const NumberLookupBot = require('../lib/bot');

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  console.log('\n📝 Make sure you have a .env file with:');
  console.log('   BOT_TOKEN=your_bot_token');
  console.log('   ADMIN_ID=your_telegram_id');
  process.exit(1);
}

console.log('🚀 Starting Number Lookup Bot in polling mode...');
console.log('   Press Ctrl+C to stop\n');

// Create bot instance with polling enabled
const bot = new NumberLookupBot({ polling: true });

console.log('✅ Bot is running!');
console.log('   Send /start to your bot to test it.\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bot...');
  process.exit(0);
});

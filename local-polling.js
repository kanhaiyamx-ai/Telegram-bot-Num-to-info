#!/usr/bin/env node

/**
 * Local Development Script - Polling Mode
 * 
 * Usage: node scripts/local-polling.js
 * 
 * Note: Delete webhook before using polling:
 *   curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
 */

require('dotenv').config();

const { BOT_TOKEN } = require('../lib/config');
const { processUpdate } = require('../lib/bot');

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found');
  console.log('Create .env file with: BOT_TOKEN=your_token');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;
let running = true;

async function getUpdates() {
  try {
    const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await response.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await processUpdate(update);
      }
    }
  } catch (error) {
    console.error('Polling error:', error.message);
  }
}

async function poll() {
  console.log('🚀 Number Lookup Bot running (polling mode)');
  console.log('   Press Ctrl+C to stop\n');

  while (running) {
    await getUpdates();
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Stopping bot...');
  running = false;
  process.exit(0);
});

poll();

#!/usr/bin/env node

/**
 * Script to set Telegram webhook for Vercel deployment
 * 
 * Usage:
 *   node scripts/set-webhook.js <VERCEL_URL>
 * 
 * Example:
 *   node scripts/set-webhook.js https://my-bot.vercel.app
 */

require('dotenv').config();
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.argv[2];

if (!BOT_TOKEN) {
  console.error('❌ Error: BOT_TOKEN not found in environment variables');
  console.log('   Make sure you have a .env file with BOT_TOKEN=your_token');
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error('❌ Error: Please provide your Vercel deployment URL');
  console.log('   Usage: node scripts/set-webhook.js <VERCEL_URL>');
  console.log('   Example: node scripts/set-webhook.js https://my-bot.vercel.app');
  process.exit(1);
}

const webhookUrl = `${VERCEL_URL}/api/webhook`;
const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

console.log('🔧 Setting webhook...');
console.log(`   Webhook URL: ${webhookUrl}`);

https.get(apiUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.ok) {
        console.log('✅ Webhook set successfully!');
        console.log(`   Description: ${result.description}`);
      } else {
        console.error('❌ Failed to set webhook');
        console.error(`   Error: ${result.description}`);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
    }
  });
}).on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

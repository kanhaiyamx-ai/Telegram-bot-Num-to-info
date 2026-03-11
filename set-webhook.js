#!/usr/bin/env node

/**
 * Set Telegram Webhook for Vercel Deployment
 * 
 * Usage: node scripts/set-webhook.js <VERCEL_URL>
 * Example: node scripts/set-webhook.js https://my-bot.vercel.app
 */

require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.argv[2];

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env');
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error('❌ Usage: node scripts/set-webhook.js <VERCEL_URL>');
  console.log('   Example: node scripts/set-webhook.js https://my-bot.vercel.app');
  process.exit(1);
}

const webhookUrl = `${VERCEL_URL}/api/webhook`;

async function setWebhook() {
  console.log('🔧 Setting webhook...');
  console.log(`   URL: ${webhookUrl}`);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      console.error('❌ Failed:', result.description);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setWebhook();

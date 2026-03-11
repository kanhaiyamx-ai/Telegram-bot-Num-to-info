// Vercel Serverless Webhook Handler
// Optimized for minimal cold start and fast responses

// Lazy-loaded bot module (singleton pattern)
let bot = null;

function getBot() {
  if (!bot) {
    const { BOT_TOKEN } = require('../lib/config');
    
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN not configured');
    }
    
    bot = require('../lib/bot').getBot();
  }
  return bot;
}

// Main handler - responds immediately, processes async
module.exports = async (req, res) => {
  // Quick health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok',
      bot: 'Number Lookup Bot v3',
      features: ['caching', 'rate-limiting', 'retry'],
      timestamp: Date.now()
    });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Respond immediately to Telegram (prevents retries)
  res.status(200).send('OK');

  // Process update asynchronously
  try {
    const update = req.body;
    
    if (update && (update.message || update.callback_query)) {
      const botInstance = getBot();
      await botInstance.processUpdate(update);
    }
  } catch (error) {
    console.error('Webhook error:', error.message);
    // Don't throw - already responded 200
  }
};

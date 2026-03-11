const { validateConfig } = require('../lib/config');
const NumberLookupBot = require('../lib/bot');

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

// Create bot instance (no polling for webhook mode)
const bot = new NumberLookupBot({ polling: false });

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const update = req.body;
      
      if (update) {
        await bot.processUpdate(update);
      }
      
      res.status(200).send('OK');
    } else if (req.method === 'GET') {
      res.status(200).json({
        status: 'running',
        bot: 'Number Lookup Bot',
        message: 'Webhook endpoint is active'
      });
    } else {
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

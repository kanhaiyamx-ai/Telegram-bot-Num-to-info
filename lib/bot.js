// Telegram Bot Core - Singleton Pattern with Caching & Rate Limiting
// Optimized for Vercel serverless with fast responses

const {
  BOT_TOKEN,
  ADMIN_ID,
  LOOKUP_API,
  SUPPORT_CONTACT,
  REQUIRED_CHANNELS,
  CHANNEL_LINKS,
  API_TIMEOUT
} = require('./config');

const {
  addUser,
  getAllUsers,
  getTotalUsers,
  banUser,
  unbanUser,
  isBanned,
  getCached,
  setCache,
  getCacheStats,
  checkRateLimit
} = require('./storage');

const {
  messages,
  formatLookupResult,
  formatMultiResultFooter,
  isValidNumber,
  extractNumber
} = require('./utils');

// Telegram API base URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ==================== TELEGRAM API HELPERS ====================

/**
 * Send message with Markdown formatting
 * Always includes parse_mode: "Markdown"
 */
async function sendMessage(chatId, text, extra = {}) {
  try {
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      ...extra
    };

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('sendMessage failed:', result.description);
    }
    
    return result;
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return null;
  }
}

// Delete message silently
async function deleteMessage(chatId, messageId) {
  try {
    await fetch(`${TELEGRAM_API}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId })
    });
  } catch (error) {
    // Ignore delete errors
  }
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId) {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });
  } catch (error) {
    // Ignore errors
  }
}

// Check chat member status
async function getChatMember(chatId, userId) {
  try {
    const response = await fetch(`${TELEGRAM_API}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId })
    });
    return await response.json();
  } catch (error) {
    console.error('getChatMember error:', error.message);
    return null;
  }
}

// ==================== KEYBOARDS ====================

const keyboards = {
  start: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Check Number', callback_data: 'check_number' }],
        [{ text: '📢 Join Channels', callback_data: 'join_channels' }],
        [{ text: '🛠 Support', url: `https://t.me/${SUPPORT_CONTACT.replace('@', '')}` }]
      ]
    }
  },
  
  forceJoin: {
    reply_markup: {
      inline_keyboard: [
        ...CHANNEL_LINKS.map(ch => [{ text: `📢 ${ch.name}`, url: ch.link }]),
        [{ text: '✅ I Joined', callback_data: 'check_join' }]
      ]
    }
  },
  
  adminPanel: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Total Users', callback_data: 'admin_total' }],
        [{ text: '🚫 Ban User', callback_data: 'admin_ban' }],
        [{ text: '✅ Unban User', callback_data: 'admin_unban' }],
        [{ text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }]
      ]
    }
  }
};

// ==================== CORE FUNCTIONS ====================

// Check if user is member of all required channels
async function checkUserMembership(userId) {
  try {
    for (const channelId of REQUIRED_CHANNELS) {
      const result = await getChatMember(channelId, userId);
      
      if (!result || !result.ok) {
        return false;
      }
      
      const status = result.result?.status;
      if (!['member', 'administrator', 'creator'].includes(status)) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('checkUserMembership error:', error.message);
    return false;
  }
}

// Check if user is admin
function isAdmin(userId) {
  return String(userId) === String(ADMIN_ID);
}

/**
 * Lookup number with timeout and retry
 * - 5 second timeout using AbortController
 * - Retry once on failure
 */
async function lookupNumber(number) {
  const attemptFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${LOOKUP_API}${number}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // First attempt
  try {
    return await attemptFetch();
  } catch (error) {
    console.error('Lookup attempt 1 failed:', error.message);
  }

  // Retry once
  try {
    console.log('Retrying lookup...');
    return await attemptFetch();
  } catch (error) {
    console.error('Lookup attempt 2 failed:', error.message);
    return null;
  }
}

// ==================== MESSAGE HANDLERS ====================

// Handle /start command
async function handleStart(chatId, userId, username) {
  addUser(userId, username);

  if (isBanned(userId)) {
    return sendMessage(chatId, messages.youAreBanned());
  }

  const isMember = await checkUserMembership(userId);

  if (!isMember) {
    return sendMessage(chatId, messages.forceJoin(), keyboards.forceJoin);
  }

  return sendMessage(chatId, messages.start(), keyboards.start);
}

// Handle /admin command
async function handleAdmin(chatId, userId) {
  if (!isAdmin(userId)) {
    return sendMessage(chatId, messages.notAuthorized());
  }

  const cacheStats = getCacheStats();
  return sendMessage(chatId, messages.adminPanel(getTotalUsers(), cacheStats), keyboards.adminPanel);
}

// Handle /ban command
async function handleBan(chatId, userId, targetId) {
  if (!isAdmin(userId)) return;

  banUser(targetId);
  return sendMessage(chatId, messages.userBanned(targetId));
}

// Handle /unban command
async function handleUnban(chatId, userId, targetId) {
  if (!isAdmin(userId)) return;

  unbanUser(targetId);
  return sendMessage(chatId, messages.userUnbanned(targetId));
}

// Handle /broadcast command
async function handleBroadcast(chatId, userId, message) {
  if (!isAdmin(userId)) return;

  const users = getAllUsers();
  let successCount = 0;

  for (const uid of Object.keys(users)) {
    try {
      await sendMessage(uid, `📢 *Broadcast*\n\n_${message}_`);
      successCount++;
    } catch (error) {
      // Continue to next user
    }
  }

  return sendMessage(chatId, messages.broadcastSent(successCount));
}

// Handle callback queries
async function handleCallback(chatId, userId, callbackQueryId, data) {
  // Answer callback immediately
  answerCallbackQuery(callbackQueryId);

  if (isBanned(userId) && !isAdmin(userId)) {
    return sendMessage(chatId, messages.youAreBanned());
  }

  switch (data) {
    case 'check_number':
      return sendMessage(chatId, messages.askNumber());

    case 'join_channels':
      return sendMessage(chatId, messages.forceJoin(), keyboards.forceJoin);

    case 'check_join':
      const isMember = await checkUserMembership(userId);
      if (isMember) {
        return sendMessage(chatId, messages.start(), keyboards.start);
      } else {
        return sendMessage(chatId, messages.notJoined(), keyboards.forceJoin);
      }

    case 'admin_total':
      if (isAdmin(userId)) {
        const cacheStats = getCacheStats();
        return sendMessage(chatId, `📊 *Stats*\n\n_Total Users:_ *${getTotalUsers()}*\n_Cache Size:_ *${cacheStats.size}* _entries_`);
      }
      break;

    case 'admin_ban':
      if (isAdmin(userId)) {
        return sendMessage(chatId, messages.banPrompt());
      }
      break;

    case 'admin_unban':
      if (isAdmin(userId)) {
        return sendMessage(chatId, messages.unbanPrompt());
      }
      break;

    case 'admin_broadcast':
      if (isAdmin(userId)) {
        return sendMessage(chatId, messages.broadcastPrompt());
      }
      break;
  }
}

// Handle number lookup with caching and rate limiting
async function handleLookup(chatId, userId, text) {
  // Check if banned
  if (isBanned(userId)) {
    return sendMessage(chatId, messages.youAreBanned());
  }

  // Check membership
  const isMember = await checkUserMembership(userId);
  if (!isMember) {
    return sendMessage(chatId, messages.forceJoin(), keyboards.forceJoin);
  }

  // Validate input
  if (!isValidNumber(text)) {
    return sendMessage(chatId, messages.invalidNumber());
  }

  const number = extractNumber(text);
  if (!number) {
    return sendMessage(chatId, messages.invalidNumber());
  }

  // Check rate limit
  if (!checkRateLimit(userId)) {
    return sendMessage(chatId, messages.rateLimited());
  }

  // Check cache first
  const cachedData = getCached(number);
  if (cachedData) {
    console.log(`Cache hit for ${number}`);
    return sendResults(chatId, cachedData, true);
  }

  // Send loading message
  const loadingResult = await sendMessage(chatId, messages.loading());
  const loadingMsgId = loadingResult?.result?.message_id;

  // Perform lookup with retry
  const result = await lookupNumber(number);

  // Delete loading message
  if (loadingMsgId) {
    deleteMessage(chatId, loadingMsgId);
  }

  // Handle API failure
  if (!result) {
    return sendMessage(chatId, messages.serviceError());
  }

  // Extract records from response
  let records = [];

  if (result.result && Array.isArray(result.result)) {
    records = result.result;
  } else if (Array.isArray(result)) {
    records = result;
  } else if (typeof result === 'object' && result.name) {
    records = [result];
  }

  // No records found
  if (records.length === 0) {
    return sendMessage(chatId, messages.noRecord());
  }

  // Cache the results
  setCache(number, records);

  // Send results
  return sendResults(chatId, records, false);
}

// Send lookup results
async function sendResults(chatId, records, fromCache) {
  // Single result
  if (records.length === 1) {
    return sendMessage(chatId, formatLookupResult(records[0], null, fromCache));
  }

  // Multiple results - deduplicate
  const seen = new Set();
  const uniqueRecords = records.filter(r => {
    const key = `${r.name || ''}-${r.address || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Send each result
  for (let i = 0; i < uniqueRecords.length; i++) {
    await sendMessage(chatId, formatLookupResult(uniqueRecords[i], i + 1, fromCache));
  }

  // Send footer
  return sendMessage(chatId, formatMultiResultFooter(uniqueRecords.length, fromCache));
}

// ==================== MAIN UPDATE PROCESSOR ====================

async function processUpdate(update) {
  try {
    // Handle callback queries
    if (update.callback_query) {
      const { id, from, message, data } = update.callback_query;
      return handleCallback(message.chat.id, from.id, id, data);
    }

    // Handle messages
    if (update.message) {
      const { chat, from, text } = update.message;
      const chatId = chat.id;
      const userId = from.id;
      const username = from.username;

      if (!text) return;

      // Command handlers
      if (text.startsWith('/start')) {
        return handleStart(chatId, userId, username);
      }

      if (text.startsWith('/admin')) {
        return handleAdmin(chatId, userId);
      }

      if (text.startsWith('/ban ')) {
        const targetId = text.replace('/ban ', '').trim();
        return handleBan(chatId, userId, targetId);
      }

      if (text.startsWith('/unban ')) {
        const targetId = text.replace('/unban ', '').trim();
        return handleUnban(chatId, userId, targetId);
      }

      if (text.startsWith('/broadcast ')) {
        const broadcastText = text.replace('/broadcast ', '').trim();
        return handleBroadcast(chatId, userId, broadcastText);
      }

      // Skip other commands
      if (text.startsWith('/')) return;

      // Handle as number lookup
      return handleLookup(chatId, userId, text);
    }
  } catch (error) {
    console.error('processUpdate error:', error.message);
  }
}

// ==================== SINGLETON EXPORT ====================

let botInstance = null;

function getBot() {
  if (!botInstance) {
    botInstance = {
      processUpdate,
      sendMessage,
      checkUserMembership
    };
  }
  return botInstance;
}

module.exports = {
  getBot,
  processUpdate,
  sendMessage,
  checkUserMembership
};
    

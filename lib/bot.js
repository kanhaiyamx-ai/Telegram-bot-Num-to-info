const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const {
  BOT_TOKEN,
  ADMIN_ID,
  LOOKUP_API,
  SUPPORT_CONTACT,
  REQUIRED_CHANNELS,
  CHANNEL_LINKS
} = require('./config');

const {
  addUser,
  getAllUsers,
  getTotalUsers,
  banUser,
  unbanUser,
  isBanned
} = require('./storage');

const {
  messages,
  formatLookupResult,
  isValidNumber,
  cleanNumber
} = require('./utils');

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

// ==================== BOT CLASS ====================

class NumberLookupBot {
  constructor(options = {}) {
    this.bot = new TelegramBot(BOT_TOKEN, options);
    this.setupHandlers();
  }

  // Check if user is member of all required channels
  async checkUserMembership(userId) {
    try {
      for (const channelId of REQUIRED_CHANNELS) {
        const member = await this.bot.getChatMember(channelId, userId);
        if (!['member', 'administrator', 'creator'].includes(member.status)) {
          console.log(`User ${userId} not a member of channel ${channelId}, status: ${member.status}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking membership:', error.message);
      return false;
    }
  }

  // Check if user is admin
  isAdmin(userId) {
    return userId.toString() === ADMIN_ID.toString();
  }

  // Lookup number via API
  async lookupNumber(number) {
    try {
      const response = await axios.get(`${LOOKUP_API}${number}`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Lookup error:', error.message);
      return null;
    }
  }

  // Setup all bot handlers
  setupHandlers() {
    // /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username;
      
      addUser(userId, username);
      
      if (isBanned(userId)) {
        return this.bot.sendMessage(chatId, messages.youAreBanned(), { parse_mode: 'Markdown' });
      }
      
      const isMember = await this.checkUserMembership(userId);
      
      if (!isMember) {
        return this.bot.sendMessage(chatId, messages.forceJoin(), {
          parse_mode: 'Markdown',
          ...keyboards.forceJoin
        });
      }
      
      this.bot.sendMessage(chatId, messages.start(), {
        parse_mode: 'Markdown',
        ...keyboards.start
      });
    });

    // /admin command
    this.bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (!this.isAdmin(userId)) {
        return this.bot.sendMessage(chatId, '_You are not authorized to access this panel._', { parse_mode: 'Markdown' });
      }
      
      this.bot.sendMessage(chatId, messages.adminPanel(getTotalUsers()), {
        parse_mode: 'Markdown',
        ...keyboards.adminPanel
      });
    });

    // Callback query handler
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const userId = query.from.id;
      const data = query.data;
      
      await this.bot.answerCallbackQuery(query.id);
      
      if (isBanned(userId) && !this.isAdmin(userId)) {
        return this.bot.sendMessage(chatId, messages.youAreBanned(), { parse_mode: 'Markdown' });
      }
      
      switch (data) {
        case 'check_number':
          this.bot.sendMessage(chatId, '_Send me a *10–15 digit phone number* to lookup:_', { parse_mode: 'Markdown' });
          break;
          
        case 'join_channels':
          this.bot.sendMessage(chatId, '_Join all channels below to use the bot:_', {
            parse_mode: 'Markdown',
            ...keyboards.forceJoin
          });
          break;
          
        case 'check_join':
          const isMember = await this.checkUserMembership(userId);
          if (isMember) {
            this.bot.sendMessage(chatId, messages.start(), {
              parse_mode: 'Markdown',
              ...keyboards.start
            });
          } else {
            this.bot.sendMessage(chatId, `_You haven't joined all channels yet. Please join all channels first._`, {
              parse_mode: 'Markdown',
              ...keyboards.forceJoin
            });
          }
          break;
          
        case 'admin_total':
          if (this.isAdmin(userId)) {
            this.bot.sendMessage(chatId, `📊 *Total Users:* _${getTotalUsers()}_`, { parse_mode: 'Markdown' });
          }
          break;
          
        case 'admin_ban':
          if (this.isAdmin(userId)) {
            this.bot.sendMessage(chatId, '_Send the User ID to ban:_\n\n_Format:_ `/ban USER_ID`', { parse_mode: 'Markdown' });
          }
          break;
          
        case 'admin_unban':
          if (this.isAdmin(userId)) {
            this.bot.sendMessage(chatId, '_Send the User ID to unban:_\n\n_Format:_ `/unban USER_ID`', { parse_mode: 'Markdown' });
          }
          break;
          
        case 'admin_broadcast':
          if (this.isAdmin(userId)) {
            this.bot.sendMessage(chatId, '_Send the message to broadcast:_\n\n_Format:_ `/broadcast YOUR_MESSAGE`', { parse_mode: 'Markdown' });
          }
          break;
      }
    });

    // Ban command
    this.bot.onText(/\/ban (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (!this.isAdmin(userId)) return;
      
      const targetId = match[1].trim();
      banUser(targetId);
      this.bot.sendMessage(chatId, messages.userBanned(targetId), { parse_mode: 'Markdown' });
    });

    // Unban command
    this.bot.onText(/\/unban (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (!this.isAdmin(userId)) return;
      
      const targetId = match[1].trim();
      unbanUser(targetId);
      this.bot.sendMessage(chatId, messages.userUnbanned(targetId), { parse_mode: 'Markdown' });
    });

    // Broadcast command
    this.bot.onText(/\/broadcast (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (!this.isAdmin(userId)) return;
      
      const broadcastMsg = match[1];
      const users = getAllUsers();
      let successCount = 0;
      
      for (const uid of Object.keys(users)) {
        try {
          await this.bot.sendMessage(uid, `📢 *Broadcast Message*\n\n_${broadcastMsg}_`, { parse_mode: 'Markdown' });
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${uid}:`, error.message);
        }
      }
      
      this.bot.sendMessage(chatId, messages.broadcastSent(successCount), { parse_mode: 'Markdown' });
    });

    // Number lookup handler (message handler)
    this.bot.on('message', async (msg) => {
      // Skip commands
      if (msg.text && msg.text.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text;
      
      if (!text) return;
      
      // Check if banned
      if (isBanned(userId)) {
        return this.bot.sendMessage(chatId, messages.youAreBanned(), { parse_mode: 'Markdown' });
      }
      
      // Check membership
      const isMember = await this.checkUserMembership(userId);
      if (!isMember) {
        return this.bot.sendMessage(chatId, messages.forceJoin(), {
          parse_mode: 'Markdown',
          ...keyboards.forceJoin
        });
      }
      
      // Validate number
      if (!isValidNumber(text)) {
        return this.bot.sendMessage(chatId, messages.invalidNumber(), { parse_mode: 'Markdown' });
      }
      
      const number = cleanNumber(text);
      
      // Send loading message
      const loadingMsg = await this.bot.sendMessage(chatId, '_🔄 Looking up number..._', { parse_mode: 'Markdown' });
      
      // Perform lookup
      const result = await this.lookupNumber(number);
      
      // Delete loading message
      try {
        await this.bot.deleteMessage(chatId, loadingMsg.message_id);
      } catch (e) {}
      
      if (!result) {
        return this.bot.sendMessage(chatId, messages.serviceError(), { parse_mode: 'Markdown' });
      }
      
      // Handle API response format: { result: [...] }
      let records = [];
      
      if (result.result && Array.isArray(result.result)) {
        records = result.result;
      } else if (Array.isArray(result)) {
        records = result;
      } else if (typeof result === 'object' && result.name) {
        records = [result];
      }
      
      if (records.length === 0) {
        return this.bot.sendMessage(chatId, messages.noRecord(), { parse_mode: 'Markdown' });
      }
      
      if (records.length === 1) {
        return this.bot.sendMessage(chatId, formatLookupResult(records[0]), { parse_mode: 'Markdown' });
      }
      
      // Multiple results - deduplicate by name+address
      const seen = new Set();
      const uniqueRecords = records.filter(r => {
        const key = `${r.name}-${r.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      for (let i = 0; i < uniqueRecords.length; i++) {
        const formatted = formatLookupResult(uniqueRecords[i], i + 1);
        await this.bot.sendMessage(chatId, formatted, { parse_mode: 'Markdown' });
      }
      
      this.bot.sendMessage(chatId, `━━━━━━━━━━━━━━\n\n_⚡ ${uniqueRecords.length} results generated by the Number Lookup Bot_`, { parse_mode: 'Markdown' });
    });

    // Error handler
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error.message);
    });
  }

  // Process webhook update (for serverless)
  processUpdate(update) {
    return this.bot.processUpdate(update);
  }
}

module.exports = NumberLookupBot;

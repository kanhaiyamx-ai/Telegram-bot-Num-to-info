// Message templates and utility functions
// All messages properly formatted for Telegram Markdown

const { SUPPORT_CONTACT } = require('./config');

// ==================== MESSAGE TEMPLATES ====================

const messages = {
  start: () => `🚀 *Number Lookup Bot*

_Welcome to the number information bot._

_Send any_ *10–15 digit phone number* _to get details such as:_

• _owner name_
• _father name_
• _address_
• _carrier / circle_
• _alternate number_
• _email (if available)_

_Example:_
\`9876543210\`

⚡ _Fast results • Clean format_

🛠 *Support:* _${SUPPORT_CONTACT}_`,

  forceJoin: () => `🚫 *Access Restricted*

_To use this bot you must join all required channels._

_After joining press_ *✅ I Joined*`,

  askNumber: () => `_Send a_ *10–15 digit phone number* _to lookup:_`,

  invalidNumber: () => `⚠️ *Invalid Number*

_Please send a valid 10–15 digit phone number._

_Example:_
\`9876543210\``,

  noRecord: () => `🔍 *No Record Found*

_This number was not found in the database._

_Possible reasons:_

• _The number is not available in the dataset_
• _The number was recently registered_
• _No public records exist_

_You can try checking another number._`,

  serviceError: () => `⚠️ *Service Error*

_The lookup service is temporarily unavailable._

_Please try again in a few minutes._`,

  rateLimited: () => `⏳ *Too Many Requests*

_Please wait a moment before trying again._

_Limit: 5 lookups per minute_`,

  loading: () => `_🔄 Looking up number..._`,

  cachedResult: () => `_📦 Cached result_`,

  adminPanel: (totalUsers, cacheStats) => `👑 *Admin Panel*

_Manage bot settings and users._

📊 *Total Users:* _${totalUsers}_
📦 *Cache Size:* _${cacheStats.size} entries_

_Select an action below:_`,

  userBanned: (userId) => `🚫 *User Banned*

_User ID_ \`${userId}\` _has been banned._`,

  userUnbanned: (userId) => `✅ *User Unbanned*

_User ID_ \`${userId}\` _can now use the bot._`,

  broadcastSent: (count) => `📢 *Broadcast Sent*

_Message delivered to_ *${count}* _users._`,

  youAreBanned: () => `🚫 *Access Denied*

_You have been banned from using this bot._

_Contact_ ${SUPPORT_CONTACT} _for support._`,

  notJoined: () => `_You haven't joined all channels yet._

_Please join all channels first._`,

  notAuthorized: () => `_You are not authorized to access this panel._`,

  banPrompt: () => `_Send the User ID to ban:_

_Format:_ \`/ban USER\\_ID\``,

  unbanPrompt: () => `_Send the User ID to unban:_

_Format:_ \`/unban USER\\_ID\``,

  broadcastPrompt: () => `_Send the message to broadcast:_

_Format:_ \`/broadcast YOUR\\_MESSAGE\``
};

// ==================== FORMATTING FUNCTIONS ====================

// Parse address from API format (separated by !)
function parseAddress(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') return [];
  return addressStr
    .split('!')
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

// Escape special Markdown characters in user data
function escapeMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  // Escape: _ * ` [
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[');
}

// Format single lookup result
function formatLookupResult(data, index = null, fromCache = false) {
  let result = index !== null 
    ? `🔎 *Result ${index}*\n\n`
    : `🔎 *Number Lookup Result*\n\n`;
  
  // Phone number
  const phone = data.mobile || data.number || data.phone;
  if (phone) {
    result += `📱 *Number:* \`${phone}\`\n\n`;
  }
  
  // Name
  if (data.name && data.name.trim()) {
    result += `👤 *Name:* _${escapeMarkdown(data.name.trim())}_\n`;
  }
  
  // Father name
  const fname = data.fname || data.fatherName;
  if (fname && fname.trim()) {
    result += `👨‍👦 *Father Name:* _${escapeMarkdown(fname.trim())}_\n`;
  }
  
  // Carrier/Circle
  const carrier = data.circle || data.carrier;
  if (carrier && carrier.trim()) {
    result += `\n📡 *Carrier:* _${escapeMarkdown(carrier.trim())}_\n`;
  }
  
  // Address
  const addressParts = parseAddress(data.address);
  if (addressParts.length > 0) {
    result += `\n🏠 *Address*\n\n`;
    addressParts.forEach(part => {
      result += `_${escapeMarkdown(part)}_\n`;
    });
  }
  
  // Alternate number
  const altNum = data.alt || data.altNumber;
  if (altNum && String(altNum).trim()) {
    result += `\n☎️ *Alternate Number:* \`${altNum}\`\n`;
  }
  
  // Email
  if (data.email && data.email.trim()) {
    result += `\n📧 *Email:* _${escapeMarkdown(data.email.trim())}_\n`;
  }
  
  // Footer for single result
  if (index === null) {
    result += `\n━━━━━━━━━━━━━━\n`;
    if (fromCache) {
      result += `\n_📦 Cached • ⚡ Result by Number Lookup Bot_`;
    } else {
      result += `\n_⚡ Result by Number Lookup Bot_`;
    }
  }
  
  return result;
}

// Format multiple results footer
function formatMultiResultFooter(count, fromCache = false) {
  let footer = `━━━━━━━━━━━━━━\n\n`;
  if (fromCache) {
    footer += `_📦 Cached • ⚡ ${count} results by Number Lookup Bot_`;
  } else {
    footer += `_⚡ ${count} results by Number Lookup Bot_`;
  }
  return footer;
}

// ==================== VALIDATION ====================

// Phone number regex: 10-15 digits
const PHONE_REGEX = /\d{10,15}/;

function isValidNumber(text) {
  if (!text || typeof text !== 'string') return false;
  return PHONE_REGEX.test(text);
}

function extractNumber(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(PHONE_REGEX);
  return match ? match[0] : null;
}

module.exports = {
  messages,
  parseAddress,
  escapeMarkdown,
  formatLookupResult,
  formatMultiResultFooter,
  isValidNumber,
  extractNumber
};

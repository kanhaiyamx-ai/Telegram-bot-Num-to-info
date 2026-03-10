# Number Lookup Telegram Bot

A Telegram bot for looking up phone number information with force-join channel verification and admin management.

## Features

- 🔍 **Number Lookup**: Get details for any 10-15 digit phone number
- 📢 **Force Join**: Users must join required channels before using the bot
- 👑 **Admin Panel**: Manage users, ban/unban, broadcast messages
- 🎨 **Clean Formatting**: Telegram Markdown with italic base and bold labels
- 🚫 **Empty Field Hiding**: Only displays available information
- ⚡ **Serverless Ready**: Optimized for Vercel deployment

## Project Structure

```
number-lookup-bot/
├── api/
│   └── webhook.js        # Vercel serverless function
├── lib/
│   ├── bot.js            # Main bot class
│   ├── config.js         # Configuration
│   ├── storage.js        # User storage
│   └── utils.js          # Message templates & utilities
├── scripts/
│   ├── set-webhook.js    # Webhook setup script
│   └── local-polling.js  # Local development script
├── data/
│   └── storage.json      # User data storage
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/YOUR_USERNAME/number-lookup-bot.git
cd number-lookup-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_ID=your_telegram_user_id
```

**How to get these values:**
- **BOT_TOKEN**: Create a bot with [@BotFather](https://t.me/BotFather) on Telegram
- **ADMIN_ID**: Send a message to [@userinfobot](https://t.me/userinfobot) to get your ID

### 4. Test Locally (Optional)

First, delete any existing webhook:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

Then run in polling mode:

```bash
npm start
```

## Deploying to Vercel

### Step 1: Upload to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/number-lookup-bot.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `number-lookup-bot` repository
4. Configure environment variables:
   - Click **"Environment Variables"**
   - Add `BOT_TOKEN` = your bot token
   - Add `ADMIN_ID` = your Telegram ID
5. Click **"Deploy"**

### Step 3: Set Webhook

After deployment, Vercel will give you a URL like `https://your-bot.vercel.app`

Run the webhook setup script:

```bash
node scripts/set-webhook.js https://your-bot.vercel.app
```

Or manually set it:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-bot.vercel.app/api/webhook"
```

### Step 4: Test Your Bot

Send `/start` to your bot on Telegram!

## Channel Configuration

The bot requires users to join these channels before use. Update `lib/config.js` to change them:

```javascript
const REQUIRED_CHANNELS = [
  -1003636897874,
  -1002211354038,
  -1002977379092
];

const CHANNEL_LINKS = [
  { id: -1003636897874, name: 'Channel 1', link: 'https://t.me/+CsuWMxnB9l81MDM1' },
  { id: -1002211354038, name: 'Channel 2', link: 'https://t.me/+MJGAHYX0H_g1YTJl' },
  { id: -1002977379092, name: 'Channel 3', link: 'https://t.me/+R7WSbWgoxi9kYzFl' }
];
```

**Important**: The bot must be an **administrator** in all required channels to check membership.

## Bot Commands

### User Commands
- `/start` - Start the bot and see welcome message

### Admin Commands
- `/admin` - Open admin panel
- `/ban USER_ID` - Ban a user
- `/unban USER_ID` - Unban a user
- `/broadcast MESSAGE` - Send message to all users

## Message Formatting

All messages follow these Telegram Markdown rules:
- Base text is *italic* (using `_text_`)
- Important labels are **bold** (using `*text*`)
- Phone numbers use `code formatting` (using backticks)
- Empty fields are automatically hidden

## Troubleshooting

### Bot not responding?

1. Check if webhook is set correctly:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

2. Check Vercel function logs for errors

3. Make sure environment variables are set in Vercel

### Can't check channel membership?

Make sure the bot is added as an **administrator** to all required channels.

### Webhook conflicts?

If you previously used polling, delete the webhook first:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"
```

## Support

Contact: @SNIPESUBZ

## License

MIT License

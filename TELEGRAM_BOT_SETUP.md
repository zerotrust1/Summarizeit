# 🤖 Telegram Bot Setup Guide

## ⚠️ Why Features Aren't Working

Your Telegram features (sending summaries to chat, showing quota, history) aren't working because:

1. **TELEGRAM_BOT_TOKEN is not set** in your environment
2. The app doesn't know which bot to send messages to
3. Without the token, all Telegram features silently fail

---

## 🚀 Step 1: Create a Telegram Bot

### Option A: Using @BotFather (Recommended)

1. **Open Telegram** and search for `@BotFather`
2. **Click /start** or send `/start`
3. **Send /newbot** to create a new bot
4. **Follow the prompts:**
   - Name: "SummarizeIT Bot" (or any name)
   - Username: "summarize_it_bot" or similar (must be unique)
5. **Copy the API Token** - looks like: `123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg`
6. **Keep this token SECRET** - anyone with it can control your bot

### Option B: Already Have a Bot?

If you already have a bot token, find it by:
1. Open Telegram, search for `@BotFather`
2. Send `/mybots`
3. Select your bot
4. Click "API Token" to view it

---

## 🌍 Step 2: Set Environment Variables

### Local Development (.env.local)

```bash
# Copy to your .env.local file (or create one):
OPENAI_API_KEY=sk-proj-your-openai-key-here
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg
```

**Location:** Create this file in the root of your project (same level as package.json)

```
summarizeit/
├── app/
├── package.json
├── .env.local          ← Create here
└── ...
```

**Example .env.local:**
```env
OPENAI_API_KEY=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
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg
```

### Production (Vercel)

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Click Settings**
4. **Click Environment Variables**
5. **Add both variables:**
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg`
   - Environments: Select all (Production, Preview, Development)
6. **Save and Redeploy**

---

## ✅ Step 3: Verify Setup

### Test Locally

```bash
# 1. Make sure .env.local has both keys
# 2. Restart your dev server
npm run dev

# 3. Go to http://localhost:3000
# 4. Summarize something
# 5. Check your Telegram chat for the message
```

### Test on Vercel

1. Deploy to Vercel (push to GitHub)
2. Verify environment variables are set
3. Redeploy
4. Test the live URL

---

## 📱 Step 4: Test Telegram Features

### Feature 1: Auto-Send Summary to Telegram

**What happens:**
- You summarize text in the web app
- Summary is automatically sent to your Telegram chat
- You receive: summary + key points + quota bar

**To test:**
1. Open your Telegram bot chat (search bot name)
2. In web app, summarize something
3. Check Telegram for the message

### Feature 2: View History (Max 10)

**What it does:**
- Stores up to 10 most recent summaries per user
- Accessible via API

**To test via API:**
```bash
# Get your Telegram user ID first
# Then use this (replace with your user ID):

curl -X POST http://localhost:3000/api/telegram/history \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_TELEGRAM_USER_ID"
  }'
```

### Feature 3: Check Quota (10/day)

**What it does:**
- Shows how many summaries you've used (X/10)
- Shows how many remain
- Shows when quota resets

**To test via API:**
```bash
curl -X POST http://localhost:3000/api/telegram/user-stats \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_TELEGRAM_USER_ID"
  }'
```

**Response example:**
```json
{
  "quota": {
    "used": 3,
    "remaining": 7,
    "limit": 10,
    "resetAt": "2025-12-28T02:18:32.000Z"
  }
}
```

---

## 🔍 Troubleshooting

### "Still not receiving messages in Telegram"

1. **Check environment variables:**
   ```bash
   # Local dev: Open .env.local
   # Vercel: Check Settings → Environment Variables
   ```

2. **Verify token format:**
   - Should be: `123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg`
   - Contains `:` (colon) separator
   - No spaces or quotes

3. **Check server logs:**
   ```bash
   # Local: npm run dev and look for errors
   # Vercel: Deployments → Click latest → Function Logs
   ```

4. **Verify bot is working:**
   - Open Telegram
   - Search for your bot by username
   - Click /start
   - If bot doesn't exist, token is wrong

5. **Test API endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/api/telegram/send-stats \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "YOUR_TELEGRAM_USER_ID",
       "includeHistory": true
     }'
   ```

### "Token is invalid"

- Token expires if you regenerate it in @BotFather
- Generate a new token in @BotFather
- Update environment variables
- Redeploy

### ".env.local file not found"

```bash
# Create it at project root:
cd your-project
touch .env.local

# Add these two lines:
OPENAI_API_KEY=sk-proj-...
TELEGRAM_BOT_TOKEN=123456789:ABC...
```

### "Can't find my Telegram User ID"

1. Open Telegram and message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Replace `<YOUR_BOT_TOKEN>` with your actual token
3. Look for `"id":` in the response - that's your user ID

**Example:**
```
https://api.telegram.org/bot123456789:ABCdefGHI/getUpdates
```

Response:
```json
{
  "ok": true,
  "result": [
    {
      "update_id": 12345,
      "message": {
        "message_id": 1,
        "from": {
          "id": 987654321,  ← YOUR USER ID
          "is_bot": false,
          "first_name": "John"
        }
      }
    }
  ]
}
```

---

## 📋 Environment Variable Checklist

### Local Development (.env.local)

```
✅ OPENAI_API_KEY set? 
   □ Yes, it starts with sk-proj-
   □ No, get from https://platform.openai.com/api-keys

✅ TELEGRAM_BOT_TOKEN set?
   □ Yes, it has format: 123456789:ABCDEF...
   □ No, get from @BotFather

✅ Restarted npm run dev after adding?
   □ Yes, stopped and restarted
   □ No, do: Ctrl+C then npm run dev
```

### Production (Vercel)

```
✅ OPENAI_API_KEY in Vercel Environment Variables?
   □ Yes
   □ No, go to Settings → Environment Variables

✅ TELEGRAM_BOT_TOKEN in Vercel Environment Variables?
   □ Yes
   □ No, go to Settings → Environment Variables

✅ All environments selected (Production, Preview, Development)?
   □ Yes
   □ No, select all 3 checkboxes

✅ Redeployed after adding?
   □ Yes, clicked Redeploy
   □ No, go to Deployments → Redeploy
```

---

## 🧪 Full Test Scenario

### Step 1: Local Setup
```bash
# 1. Create .env.local with both keys
echo "OPENAI_API_KEY=sk-proj-..." > .env.local
echo "TELEGRAM_BOT_TOKEN=123456789:ABC..." >> .env.local

# 2. Restart dev server
npm run dev

# 3. Open http://localhost:3000
```

### Step 2: Test Web App
```
1. Upload an image or PDF
2. Click "Extract Text"
3. Verify text extracted
4. Click "Summarize"
5. Wait for summary
6. Check Telegram for automatic message
```

### Step 3: Verify Telegram Message

**You should receive:**
```
📋 Summary

This is a comprehensive summary of the content...

🎯 Key Points:
1. First key point
2. Second key point
3. Third key point

📊 Quota: ██████░░░░ 3/10 (7 left)
```

### Step 4: Check History
```bash
curl -X POST http://localhost:3000/api/telegram/history \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_TELEGRAM_USER_ID"}'
```

---

## 📚 Related Files

- **Telegram Setup:** This file (TELEGRAM_BOT_SETUP.md)
- **Features Guide:** TELEGRAM_FEATURES.md
- **API Reference:** TELEGRAM_IMPLEMENTATION_SUMMARY.md
- **Code Review:** CODE_REVIEW.md

---

## ⚡ Quick Commands

```bash
# Get your bot info
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getMe

# Check updates (to find your user ID)
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates

# Send test message
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "YOUR_USER_ID", "text": "Test message"}'
```

---

## ✅ Success Checklist

- [ ] Created bot with @BotFather
- [ ] Copied bot API token
- [ ] Added TELEGRAM_BOT_TOKEN to .env.local (local) or Vercel (production)
- [ ] Restarted dev server or redeployed to Vercel
- [ ] Opened your bot chat in Telegram
- [ ] Tested summarization from web app
- [ ] Received summary message in Telegram
- [ ] Verified quota display in Telegram message

---

**You're all set! 🎉** Your Telegram bot should now work perfectly!

For issues, check the **Troubleshooting** section above or review the logs.

# Quick Start: Fix "Server Configuration Error"

## The Problem
You get: **"Server configuration error. Please contact support."** when trying to summarize.

## The Solution (3 Steps)

### Step 1: Get Your OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)

### Step 2: Set Up Local Development

#### Copy the environment template:
```bash
cp .env.local.example .env.local
```

#### Open `.env.local` and add your key:
```env
OPENAI_API_KEY=sk-proj-your-key-here
```

#### Restart the dev server:
```bash
npm run dev
```

#### Test it:
- Go to http://localhost:3000
- Try uploading an image or entering text
- Click "Summarize"
- ✅ Should work now!

---

## For Vercel (Live App)

### Step 1: Get Your OpenAI API Key
Same as above (if you don't have one already)

### Step 2: Add to Vercel
1. Go to your Vercel project dashboard
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Click **Add New**
5. Fill in:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-your-key-here` (your actual key)
   - **Environments:** Check all boxes (Production, Preview, Development)
6. Click **Add**

### Step 3: Redeploy
1. Go back to **Deployments** tab
2. Find your latest deployment
3. Click on it
4. Click **Redeploy** button (blue button on right)
5. Wait ~1-2 minutes for it to finish

### Step 4: Test
- Open your live app URL
- Try uploading an image or entering text
- Click "Summarize"
- ✅ Should work now!

---

## Optional: Telegram Integration

If you want to send summaries to Telegram:

### Local
Add to `.env.local`:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg
```

Get token from @BotFather on Telegram

### Vercel
Add to Environment Variables (same as OPENAI_API_KEY):
- **Name:** `TELEGRAM_BOT_TOKEN`
- **Value:** Your bot token from @BotFather

---

## Features You Now Have

✅ **10 summarizations per day per user** (Telegram users only)
✅ **Proper error messages** — tells you exactly what's wrong
✅ **No double-submission** — can't spam the button
✅ **Quota tracking** — see how many you have left
✅ **Security** — Telegram signature verification

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Still getting "Server configuration error" locally | Make sure you restarted `npm run dev` after adding `.env.local` |
| Still getting error on Vercel | Make sure you redeployed after adding the environment variable |
| Getting "Invalid API key" error | Your key is wrong or expired — get a new one from OpenAI |
| Quota exceeded error | You've used all 10 summarizations today. Try again tomorrow. |

---

## That's It! 🎉

Your app should now work. If you have issues, check `ENV_SETUP.md` for detailed troubleshooting.

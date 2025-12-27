# Environment Setup Guide

## What is the "Server Configuration Error"?

If you see **"Server configuration error. Please contact support."** when trying to summarize in the live web app, it means the `OPENAI_API_KEY` environment variable is not set on the server.

## How to Fix It

### For Local Development

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` and add your OpenAI API key:**
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
   
   Get your key from: https://platform.openai.com/api-keys

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

4. **Verify it works:**
   - Open http://localhost:3000
   - Upload an image or enter text
   - Click "Summarize" — it should now work

### For Production (Vercel)

1. **Go to your Vercel project dashboard**

2. **Navigate to Settings → Environment Variables**

3. **Add a new environment variable:**
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-your-actual-key-here` (from https://platform.openai.com/api-keys)
   - **Environments:** Check all (Production, Preview, Development)

4. **Click "Add"**

5. **Redeploy your project:**
   - Go to Deployments tab
   - Click the latest deployment
   - Click "Redeploy" button

6. **Wait for deployment to complete** (usually 1-2 minutes)

7. **Test your live app** — it should now work

## Optional: Telegram Bot Token

If you want to send summaries to Telegram, also set:

**For Local Development:**
```
# In .env.local
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvWXYZabcdefg
```

Get your token from @BotFather on Telegram.

**For Production (Vercel):**
- Same process as above, but add `TELEGRAM_BOT_TOKEN` as another environment variable

## Troubleshooting

### "OPENAI_API_KEY not configured in environment"
- You're running the server without the environment variable set
- Make sure you copied `.env.local.example` → `.env.local`
- Make sure you added your real API key (starts with `sk-proj-`)
- Restart the development server

### "Invalid OpenAI API key"
- Your API key is invalid or expired
- Generate a new one: https://platform.openai.com/api-keys
- Make sure there are no extra spaces in the key

### Still seeing "Server configuration error" on Vercel?
- Make sure the Vercel environment variable is set (Settings → Environment Variables)
- Make sure you redeployed after adding the variable (Deployments → Redeploy)
- Check the deployment logs: Deployments → Click deployment → Function logs

## Security Notes

- **Never commit `.env.local`** — it contains secrets (already in `.gitignore`)
- **Never share your API keys** — treat them like passwords
- Keep your OpenAI API key private to prevent unauthorized usage
- If you accidentally commit a key, rotate it immediately in the OpenAI dashboard

## What Each Variable Does

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI summarization | Yes, for all features |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for sending summaries to Telegram | No, only needed for Telegram integration |

## Testing the Setup

**Local test:**
```bash
# Make sure .env.local has your key
npm run dev

# Then visit http://localhost:3000 and try summarizing
```

**Vercel test:**
- Visit your deployment URL
- Try uploading an image or entering text
- Click "Summarize"
- Should get a summary without errors

If you get a summary with key points, your setup is complete! ✅

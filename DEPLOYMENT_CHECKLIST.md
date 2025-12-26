# SummarizeIT AI - Deployment Checklist

## Pre-Deployment ✓

- [x] Project builds successfully (`npm run build`)
- [x] TypeScript compilation passes
- [x] All API routes defined
- [x] Environment variables configured
- [x] UI responsive and mobile-optimized
- [x] Telegram Mini App SDK integrated
- [x] `.env.local` in `.gitignore`
- [x] README and setup guides completed

## Local Testing Steps

Before deploying, verify locally:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your OpenAI key
cp .env.local.example .env.local
# Edit .env.local and add: OPENAI_API_KEY=sk-...

# 3. Run development server
npm run dev

# 4. Test in browser at http://localhost:3000
# - Upload an image
# - Extract text (OCR)
# - Summarize with AI
# - Verify results display correctly
```

## Vercel Deployment Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Initial SummarizeIT AI MVP"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select "Next.js" as framework (auto-detected)

### 3. Configure Environment Variables
**Important: Do this BEFORE deploying**

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `OPENAI_API_KEY` | `sk-your-actual-key` | Production, Preview, Development |

Click "Save" and then deploy.

### 4. Deploy
- Vercel will automatically deploy your main branch
- Or manually click "Deploy" in dashboard
- Wait for build to complete (usually 1-2 minutes)

### 5. Get Your URL
After successful deployment:
- Your Mini App URL: `https://your-project.vercel.app`
- Share this URL with your Telegram bot

## Post-Deployment Verification

After deployment completes:

1. **Test the URL directly** (without Telegram)
   ```
   https://your-project.vercel.app
   ```
   - Should load without errors
   - UI should be responsive

2. **Monitor in Vercel Dashboard**
   - Check "Deployments" tab for status
   - Check "Analytics" for errors

3. **Test API Endpoints** (optional)
   ```bash
   # Test OCR endpoint
   curl -X POST https://your-project.vercel.app/api/ocr \
     -F "image=@test-image.png"
   
   # Test Summarize endpoint
   curl -X POST https://your-project.vercel.app/api/summarize \
     -H "Content-Type: application/json" \
     -d '{"text":"Your text here..."}'
   ```

4. **Open in Telegram Mini App**
   - Create button in bot that opens: `https://your-project.vercel.app`
   - Test full flow: Upload → Extract → Summarize

## Telegram Bot Setup

### Create Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow prompts to create your bot
4. Save your **Bot Token**

### Add Mini App Button to Bot

Option A: Using Python/Node bot library
```javascript
// Example: Add button to /start command
const keyboard = {
  inline_keyboard: [[
    {
      text: "Open SummarizeIT AI",
      web_app: { url: "https://your-vercel-url.vercel.app" }
    }
  ]]
};
```

Option B: Using BotFather commands
- Use `/setcommands` to configure `/start` command
- Use inline keyboard markup to add web app button

## Environment Variables Reference

### Required
- `OPENAI_API_KEY` - Get from [platform.openai.com](https://platform.openai.com/api-keys)

### Optional
- `TELEGRAM_BOT_TOKEN` - For future backend integration

## Troubleshooting Deployment

### Build Fails
- Check build logs in Vercel: "Deployments" → failed build → logs
- Common issues:
  - Missing `OPENAI_API_KEY` (set in Environment Variables)
  - TypeScript errors (run `npm run build` locally first)

### Mini App Not Loading
- Verify Vercel URL is accessible
- Check if domain is in Telegram's whitelist (usually not needed)
- Clear browser cache and try again

### API Endpoints Return 500
- Check Vercel Function logs: "Deployments" → "View Functions"
- Verify `OPENAI_API_KEY` is correctly set
- Check OpenAI account has credits

### OCR Processing Slow
- Tesseract.js runs client-side
- Large images take longer
- Guide users to upload smaller/clearer images

## Performance Optimization

After deployment:

1. **Monitor Vercel Analytics**
   - Check average response times
   - Monitor edge function usage

2. **Optimize Images**
   - Consider adding image compression before upload
   - Reduces OCR processing time

3. **Set Up Error Tracking** (Optional)
   - Integrate Sentry or similar for error monitoring
   - Add event tracking for usage analytics

## Security Checklist

- [x] `.env.local` not committed to git
- [x] API keys only stored as Vercel environment variables
- [x] HTTPS enforced (automatic with Vercel)
- [x] Input validation on API routes
- [x] CORS properly configured if needed

## Rollback Plan

If deployment has issues:

```bash
# Revert to previous deployment in Vercel Dashboard
# Or redeploy from specific commit:
git revert <commit-hash>
git push origin main
# Vercel will auto-deploy the reverted code
```

## Next Steps

1. ✅ Test deployment in production
2. ⏭ Monitor performance metrics
3. ⏭ Gather user feedback
4. ⏭ Plan v2 features (auth, history, etc.)
5. ⏭ Scale infrastructure if needed

---

**Need Help?**
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
- Check [README.md](./README.md) for troubleshooting
- Review [Vercel Docs](https://vercel.com/docs)

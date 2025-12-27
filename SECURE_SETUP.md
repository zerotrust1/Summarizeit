# Secure OpenAI API Key Setup

## 🚨 Action Required: Rotate Your API Key

OpenAI flagged that an API key might be exposed. **Follow these steps immediately:**

### Step 1: Deactivate Old Key (OpenAI Dashboard)
1. Go to: https://platform.openai.com/api-keys
2. Find the key you used in `.env.local`
3. Click the trash icon to **delete/deactivate** it
4. Confirm deletion

### Step 2: Create New Key (OpenAI Dashboard)
1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. **IMPORTANT:** Copy it immediately and save in a secure location
4. You won't see it again after closing this dialog

### Step 3: Update Vercel (Production)
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Find the `OPENAI_API_KEY` variable
3. Click the pencil icon to edit
4. Paste the **new key** (from Step 2)
5. Click **Save**
6. Go to Deployments → Redeploy latest commit
7. Wait for deployment to complete

### Step 4: Update Local Development
1. Edit `.env.local` in your project:
   ```bash
   OPENAI_API_KEY=sk-proj-your-new-key-here
   ```
2. Replace with the new key from Step 2
3. Restart `npm run dev`
4. Test locally at http://localhost:3000

### Step 5: Verify It Works
- **Local:** http://localhost:3000 → Try summarizing
- **Production:** Your Vercel URL → Try summarizing
- Both should work without "Server configuration error"

---

## ✅ Best Practices Going Forward

### 1. Never Commit `.env.local`
✅ Already set up correctly in `.gitignore`
- `.env.local` is never pushed to GitHub
- Only `.env.local.example` with placeholders is in git

### 2. Use Vercel for Production Secrets
- Set all production keys in **Vercel Environment Variables**
- Never hardcode keys in code
- Use different keys for development vs production

### 3. Protect Local `.env.local`
- Keep `.env.local` locally only
- Don't share it
- Rotate keys periodically

### 4. Monitor Key Usage
- Regularly check OpenAI usage dashboard
- Set spending limits if needed
- Alert on unusual activity

---

## 📋 Checklist

- [ ] Deleted old OpenAI key from OpenAI dashboard
- [ ] Created new OpenAI key
- [ ] Updated Vercel environment variable with new key
- [ ] Redeployed on Vercel
- [ ] Updated `.env.local` with new key locally
- [ ] Tested local app (http://localhost:3000)
- [ ] Tested production app (your Vercel URL)
- [ ] Both apps work without "Server configuration error"

---

## 🔒 How the App Handles Keys Securely

### Environment Variables
- Only used in **server-side code** (API routes)
- Never exposed to browser/client
- Loaded by Next.js at build time

### What Stays Secret
- `OPENAI_API_KEY` - Only in Vercel dashboard + local `.env.local`
- `TELEGRAM_BOT_TOKEN` - Only in Vercel dashboard + local `.env.local`

### What's Public
- Code in `/app` directory (git-tracked)
- Frontend code (visible to users)
- Documentation with placeholder keys

### What Gets Deleted
- Real `.env.local` (git-ignored, never pushed)
- `.next/` build artifacts (git-ignored)
- `node_modules/` (git-ignored)

---

## 🆘 If You Still See "Server Configuration Error"

1. **Check Vercel Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure `OPENAI_API_KEY` is there
   - Make sure all environments are checked (Production, Preview, Development)

2. **Redeploy:**
   - Go to Deployments tab
   - Click latest deployment
   - Click "Redeploy" button
   - Wait for completion

3. **Check Deployment Logs:**
   - Deployments → Click latest → Function Logs
   - Look for `[CRITICAL] OPENAI_API_KEY not configured`
   - If you see this, the env var wasn't passed correctly

4. **Hard Refresh Browser:**
   - Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear browser cache
   - Try again

---

## 📞 Support

If after rotating the key you still have issues:

1. Verify the new key works locally: `npm run dev`
2. Verify it's in Vercel (Settings → Environment Variables)
3. Check that you redeployed after adding the variable
4. Hard refresh your browser (Ctrl+Shift+R)

Your old key is now inactive, so even if it was exposed, it can't be used. ✅

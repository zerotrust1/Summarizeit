# ⚠️ URGENT: Rotate Your OpenAI API Key

OpenAI flagged your old key. **Follow these 5 steps now:**

---

## STEP 1: Delete Old Key (2 minutes)

Go to: https://platform.openai.com/api-keys

1. Find your old key (the one you put in `.env.local`)
2. Click the **trash/delete icon**
3. Confirm deletion

✅ Old key is now inactive and can't be used

---

## STEP 2: Create New Key (1 minute)

Go to: https://platform.openai.com/api-keys

1. Click **"Create new secret key"**
2. **COPY IT IMMEDIATELY** (you won't see it again!)
3. Save it somewhere temporarily (copy paste it)

Your new key looks like: `sk-proj-xxxxxxxxxxx...`

---

## STEP 3: Update Vercel (3 minutes)

Go to: https://vercel.com/dashboard

1. Click your **"summarizeit"** project
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Find **OPENAI_API_KEY** row
5. Click the **pencil icon** (edit)
6. **Delete the old value**
7. **Paste the new key** from Step 2
8. Click **Save**

---

## STEP 4: Redeploy on Vercel (2 minutes)

Still in Vercel:

1. Click **Deployments** (top menu)
2. Find your latest deployment
3. Click on it
4. Click **Redeploy** button (blue, on the right)
5. Wait for it to say "Ready" (1-2 minutes)

---

## STEP 5: Update Local & Test (2 minutes)

On your computer:

1. Edit `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-your-new-key-here
   ```
   Replace with the new key from Step 2

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Test at http://localhost:3000
   - Upload an image or enter text
   - Click "Summarize"
   - Should work! ✅

4. Test production at your Vercel URL
   - Should also work! ✅

---

## ✅ You're Done!

- [ ] Step 1: Deleted old key
- [ ] Step 2: Created new key (copied it)
- [ ] Step 3: Updated Vercel with new key
- [ ] Step 4: Redeployed on Vercel
- [ ] Step 5: Updated `.env.local` and tested

---

## 🔒 What's Secure Now

✅ Old key is deleted (can't be used)
✅ New key is only in:
  - Vercel Environment Variables (private)
  - Your local `.env.local` (not in git)
✅ No keys in git history
✅ No keys in code
✅ No keys in production files

Your app is now **fully secure**! 🎉

---

## If It Still Doesn't Work

**Local (.env.local):**
- Make sure you restarted `npm run dev` after editing `.env.local`
- Try `Ctrl+C` to stop the server, then `npm run dev` again
- Check that the key in `.env.local` matches Step 2 exactly

**Vercel (Production):**
- Make sure you clicked "Save" after pasting the new key
- Make sure you redeployed (Deployments → Redeploy)
- Try hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Wait 2-3 minutes for new deployment to be ready

**Still stuck?**
- Check SECURE_SETUP.md for detailed troubleshooting
- Or check function logs in Vercel Deployments

# SummarizeIT AI - Setup & Deployment Guide

## Overview
SummarizeIT AI is a Telegram Mini App that extracts text from images using OCR and provides AI-powered summaries.

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes
- **OCR**: Tesseract.js
- **AI**: OpenAI API (GPT-4O Mini)
- **Deployment**: Vercel

---

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API Key (get from https://platform.openai.com/api-keys)

### Step 1: Install Dependencies
```bash
cd summarizeit
npm install
```

### Step 2: Configure Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 4: Test the App Locally
1. Open `http://localhost:3000` in your browser
2. Upload an image with text (screenshot, notes, document, etc.)
3. Click "Extract Text" to run OCR
4. Click "Summarize with AI" to get the summary

---

## Telegram Mini App Integration

### Setting Up Your Telegram Bot

1. **Create a Bot** via BotFather (@BotFather on Telegram)
   - `/newbot` → Follow the steps → Save your Bot Token

2. **Configure the Webhook**
   - Set up your backend to receive messages from Telegram
   - This MVP focuses on the Mini App UI; bot integration is optional for the initial version

3. **Launch the Mini App**
   - In your bot, add a button that opens the Mini App
   - Point it to your Vercel deployment URL
   - Telegram Mini Apps automatically include the Telegram WebApp context

### Mini App URL Format
When deploying to Vercel:
```
https://yourdomain.vercel.app
```

Add this to your bot's inline keyboard or /start command to launch the Mini App.

---

## Deployment on Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial SummarizeIT AI MVP"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Environment Variables
In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add the following:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (if needed for backend)

3. Click "Save"

### Step 4: Trigger Deployment
- Vercel will automatically deploy when you push to main
- Or click "Redeploy" in the Vercel dashboard

---

## API Endpoints

### 1. OCR Extraction
**Endpoint**: `POST /api/ocr`

**Request**:
```
Content-Type: multipart/form-data
Form data: image (File)
```

**Response**:
```json
{
  "success": true,
  "text": "Extracted text from image..."
}
```

### 2. Summarization
**Endpoint**: `POST /api/summarize`

**Request**:
```json
{
  "text": "Long text to summarize..."
}
```

**Response**:
```json
{
  "success": true,
  "summary": "Concise summary here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}
```

---

## Features

✅ **Image Upload** - Select images from device  
✅ **OCR Text Extraction** - Tesseract.js powered  
✅ **AI Summarization** - OpenAI GPT-4O Mini  
✅ **Key Points Generation** - Automatic bullet points  
✅ **Dark Mode** - Native Telegram styling  
✅ **Responsive Design** - Optimized for mobile  
✅ **Telegram Integration** - Native Mini App support  

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (for backend) | No |

---

## Troubleshooting

### OCR Not Working
- Ensure the image has clear, readable text
- Try different image formats (JPG, PNG)
- Check browser console for errors

### Summarization Fails
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has available credits
- Ensure extracted text is not empty

### Telegram Mini App Not Loading
- Verify URL is accessible from Telegram
- Check that the bot token is valid
- Ensure your Vercel domain is whitelisted in Telegram

---

## Performance Optimization Tips

1. **OCR Processing**: Tesseract.js runs on the client-side, so processing time depends on image size and browser
2. **Image Optimization**: Compress images before upload for faster processing
3. **API Rate Limiting**: OpenAI has rate limits; monitor your usage on the dashboard

---

## Next Steps for Production

- [ ] Add user authentication (optional)
- [ ] Implement rate limiting for API calls
- [ ] Add image preprocessing for better OCR accuracy
- [ ] Create a database to store user history
- [ ] Add analytics tracking
- [ ] Implement caching for repeated summaries
- [ ] Add support for multiple languages
- [ ] Create admin dashboard for monitoring

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check Telegram Mini App docs: https://core.telegram.org/bots/webapps

---

## License

MIT License - Feel free to use and modify as needed.

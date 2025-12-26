# SummarizeIT AI - Telegram Mini App MVP

> Extract text from images using OCR and get instant AI-powered summaries with bullet points.

A Telegram Mini App built with Next.js that brings the power of AI summarization directly to Telegram users.

## 🚀 Features

- **📸 Image Upload** - Easily upload screenshots, notes, or documents
- **🧠 OCR Text Extraction** - Powered by Tesseract.js for accurate text recognition
- **✨ AI Summarization** - OpenAI GPT-4O Mini generates concise summaries
- **📌 Key Points** - Automatic bullet-point extraction from summaries
- **🌙 Dark Mode Support** - Native Telegram styling with light/dark themes
- **📱 Mobile First** - Optimized for Telegram's mobile-first environment
- **⚡ Fast & Responsive** - Instant processing and smooth UX

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | Full-stack framework |
| **React 19** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Responsive styling |
| **Tesseract.js** | OCR engine |
| **OpenAI API** | AI summarization |
| **Vercel** | Production deployment |

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key from [platform.openai.com](https://platform.openai.com)
- GitHub account (for Vercel deployment)

## 🏃 Quick Start

### 1. Clone and Install
```bash
cd summarizeit
npm install
```

### 2. Setup Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to test the app locally.

### 4. Test the Flow
1. Upload an image with text (screenshot, document, etc.)
2. Click "Extract Text" to run OCR
3. Click "Summarize with AI" to get the summary
4. View results with key points

## 📦 Deployment on Vercel

### Prerequisites
- GitHub repository with your code pushed
- Vercel account

### Step-by-Step Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial SummarizeIT AI MVP"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel, go to Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your OpenAI key
   - Click "Save and Deploy"

4. **Get Your Mini App URL**
   - After deployment, Vercel provides your production URL
   - Example: `https://summarizeit-ai.vercel.app`

### 🔗 Connect to Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Save your bot token
3. Configure a button in your bot that opens the Mini App:
   ```
   https://your-vercel-url.vercel.app
   ```

## 🔌 API Endpoints

### POST `/api/ocr`
Extracts text from an uploaded image.

**Request:**
```
Content-Type: multipart/form-data
- image: File
```

**Response:**
```json
{
  "success": true,
  "text": "Extracted text from image..."
}
```

### POST `/api/summarize`
Generates AI summary and key points.

**Request:**
```json
{
  "text": "Long text to summarize..."
}
```

**Response:**
```json
{
  "success": true,
  "summary": "Concise 2-3 sentence summary...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}
```

## 📁 Project Structure

```
summarizeit/
├── app/
│   ├── api/
│   │   ├── ocr/route.ts          # OCR endpoint
│   │   └── summarize/route.ts    # Summarization endpoint
│   ├── page.tsx                   # Main UI component
│   ├── layout.tsx                 # Root layout with Telegram SDK
│   └── globals.css                # Tailwind CSS
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `TELEGRAM_BOT_TOKEN` | No | For future backend integration |

## 🐛 Troubleshooting

### "OCR not extracting text"
- Ensure image has clear, readable text
- Try JPG or PNG formats
- Check browser console for errors

### "Summarization fails"
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has available credits
- Ensure extracted text is not empty

### "Telegram Mini App not loading"
- Verify URL is publicly accessible
- Check bot token is valid
- Ensure URL is whitelisted in Telegram

## 🚀 Next Steps / Future Enhancements

- [ ] User authentication & history
- [ ] Rate limiting & usage monitoring
- [ ] Support for multiple languages
- [ ] Database integration for user data
- [ ] Image preprocessing for better OCR
- [ ] Caching for repeated summaries
- [ ] Admin dashboard for analytics
- [ ] Premium features (longer summaries, export to PDF)

## 📚 Resources

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 💡 Support

For detailed setup guide, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

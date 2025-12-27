# 📱 Telegram Features Documentation

## Overview

Three essential Telegram features have been added to SummarizeIT:

1. **Recap Summary Sending** - Automatically send summarization to Telegram chat with quota info
2. **User History Tracking** - Store and retrieve up to 10 most recent summaries per user
3. **Quota Display** - Show remaining summarizations for the day with visual progress bar

---

## 1. 📤 Recap Summary Sending to Telegram

### What It Does
When a user summarizes content in the Telegram Mini App, the summary is automatically sent to their Telegram chat with:
- The full summary text
- Key points (bullet list)
- Current quota usage (with visual bar)
- Time remaining until quota resets

### How It Works

**Flow:**
```
User submits text in Telegram Mini App
  ↓
App calls /api/summarize-and-send
  ↓
OpenAI generates summary
  ↓
Summary is saved to history (max 10)
  ↓
Summary + quota info formatted for Telegram
  ↓
Sent to user's Telegram chat automatically
  ↓
User receives message in Telegram
```

### Message Format

```
📋 Summary

This is the AI-generated summary of the content...

🎯 Key Points:
1. First important point
2. Second important point
3. Third important point

📊 Quota: ██████░░░░ 6/10 (4 left)
```

### API Endpoint

**Endpoint:** `POST /api/summarize-and-send`

**Request:**
```json
{
  "text": "Content to summarize...",
  "initData": "Telegram WebApp initData string"
}
```

**Response:**
```json
{
  "success": true,
  "summary": "...",
  "keyPoints": [...],
  "quotaRemaining": 4,
  "quotaResetAt": "2025-12-28T02:18:32Z",
  "telegram": {
    "sent": true,
    "error": null
  }
}
```

---

## 2. 📚 User History Tracking

### What It Does
Stores up to 10 most recent summaries per user (identified by Telegram user ID).

Each summary record includes:
- Summary text
- Key points
- Original text (first 200 characters)
- Creation timestamp
- Unique summary ID

### How It Works

**Storage:**
- Development: File-based storage in `/tmp/telegram_user_history.json`
- Production: Ready for migration to database/Redis
- Persistent across server restarts
- Max 10 summaries per user (oldest auto-deleted)

**When History is Saved:**
- Automatically when user summarizes in Telegram context
- Saved for both `/api/summarize` and `/api/summarize-and-send`
- Only for authenticated Telegram users

### Get User History

**Endpoint:** `POST /api/telegram/history`

**Request:**
```json
{
  "initData": "Telegram WebApp initData string"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "123456",
  "historyCount": 3,
  "maxHistory": 10,
  "summaries": [
    {
      "id": "1735318712345-abc123",
      "summary": "...",
      "keyPoints": [...],
      "originalText": "First 200 characters of original text...",
      "createdAt": "2025-12-27T12:45:12.000Z"
    }
  ],
  "telegramMessage": "📚 <b>Your Recent Summaries</b>..."
}
```

### Send History to Telegram

**Endpoint:** `POST /api/telegram/send-stats`

**Request:**
```json
{
  "initData": "Telegram WebApp initData string",
  "includeHistory": true
}
```

**Response:**
```json
{
  "success": true,
  "quotaSent": true,
  "historySent": true
}
```

**What User Receives in Telegram:**
1. Quota message (first)
2. History list (second, if includeHistory=true)

---

## 3. 📊 Quota Display (10/day)

### What It Does
Shows each user's daily summarization limit (10 per day) with:
- Visual progress bar (█ filled, ░ empty)
- Number of summaries used and remaining
- Percentage usage
- Time until quota resets

### Message Format

```
📊 Daily Summarization Quota

██████░░░░
6/10 summaries used (60%)

✅ 4 summarizations left today

⏰ Resets in:
20h 15m
```

### How It Works

**Quota System:**
- 24-hour rolling window (not fixed daily reset)
- Resets individually for each user
- Tracked by Telegram user ID
- Persistent storage

**Quota Endpoints:**

1. **Get User Quota Info** - `POST /api/telegram/user-stats`
   ```json
   {
     "success": true,
     "quota": {
       "used": 6,
       "remaining": 4,
       "limit": 10,
       "resetAt": "2025-12-28T02:18:32Z",
       "percentageUsed": 60
     }
   }
   ```

2. **Send Quota to Telegram** - `POST /api/telegram/send-stats`
   - Sends formatted quota message directly to user's chat

---

## 📱 Frontend Integration

### In Telegram Mini App

To use these features in your Telegram Mini App frontend:

```typescript
// 1. Get Telegram init data
const initData = window.Telegram?.WebApp?.initData;

// 2. Send text for summarization (with automatic history + telegram send)
const response = await fetch('/api/summarize-and-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: userText,
    initData: initData
  })
});

// 3. Get user history
const historyResponse = await fetch('/api/telegram/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData })
});

// 4. Get quota stats
const statsResponse = await fetch('/api/telegram/user-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData })
});

// 5. Send quota message to Telegram
const sendStatsResponse = await fetch('/api/telegram/send-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData, includeHistory: true })
});
```

---

## 🔧 API Endpoints Summary

### New Telegram Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/summarize-and-send` | POST | Summarize and send to Telegram (existing, enhanced) |
| `/api/telegram/user-stats` | POST | Get user quota + history stats |
| `/api/telegram/history` | POST | Get user's full history |
| `/api/telegram/send-stats` | POST | Send quota + history to Telegram chat |

---

## 💾 Data Storage

### File Locations (Development)

```
/tmp/
├── telegram_user_quotas.json        (quota tracking)
└── telegram_user_history.json       (history tracking)
```

### Data Format

**User Quota Record:**
```json
{
  "userId": "123456",
  "count": 6,
  "resetAt": 1735404712345
}
```

**User History Record:**
```json
{
  "userId": "123456",
  "summaries": [
    {
      "id": "1735318712345-abc123",
      "userId": "123456",
      "summary": "...",
      "keyPoints": [...],
      "originalText": "...",
      "createdAt": 1735318712345,
      "createdAtDate": "2025-12-27T12:45:12.000Z"
    }
  ],
  "lastUpdated": 1735318712345
}
```

---

## 🔒 Security

### Telegram Signature Verification
- All requests validate Telegram initData signature using HMAC-SHA256
- Prevents forged requests from non-Telegram sources
- Uses bot token as secret key

### User Privacy
- User ID extracted from Telegram initData
- No personal data stored beyond summaries
- History limited to 10 entries to manage storage
- Can be cleared by user (admin function available)

### Data Storage
- Development: File-based (temporary storage)
- Production: Ready for database migration
- All data persisted securely

---

## 🚀 Usage Examples

### Example 1: Summarize and Auto-Send to Telegram

```typescript
const response = await fetch('/api/summarize-and-send', {
  method: 'POST',
  body: JSON.stringify({
    text: "Long article or document text...",
    initData: window.Telegram.WebApp.initData
  })
});

const data = await response.json();
console.log(data.summary);           // AI summary
console.log(data.keyPoints);         // Key points
console.log(data.quotaRemaining);    // Remaining quota
console.log(data.telegram.sent);     // Was it sent to Telegram?
```

### Example 2: Check User Quota

```typescript
const response = await fetch('/api/telegram/user-stats', {
  method: 'POST',
  body: JSON.stringify({
    initData: window.Telegram.WebApp.initData
  })
});

const stats = await response.json();
console.log(`Used: ${stats.quota.used}/10`);
console.log(`Remaining: ${stats.quota.remaining}`);
console.log(`Resets at: ${stats.quota.resetAt}`);
```

### Example 3: Get User History

```typescript
const response = await fetch('/api/telegram/history', {
  method: 'POST',
  body: JSON.stringify({
    initData: window.Telegram.WebApp.initData
  })
});

const history = await response.json();
history.summaries.forEach(s => {
  console.log(`${s.createdAt}: ${s.originalText}`);
});
```

### Example 4: Send Stats to User's Chat

```typescript
const response = await fetch('/api/telegram/send-stats', {
  method: 'POST',
  body: JSON.stringify({
    initData: window.Telegram.WebApp.initData,
    includeHistory: true  // Include history or just quota
  })
});

const result = await response.json();
console.log(`Quota sent: ${result.quotaSent}`);
console.log(`History sent: ${result.historySent}`);
```

---

## 📝 Implementation Status

✅ User history tracking (max 10 per user)
✅ Recap summary sending to Telegram with quota info
✅ Quota display with visual progress bar
✅ All API endpoints created
✅ Telegram signature verification
✅ Persistent storage
✅ Build & Lint passing

---

## 🔄 Migration Path (Future)

### From File Storage to Database

```typescript
// Current (development):
// Storage: /tmp/telegram_user_history.json
// Storage: /tmp/telegram_user_quotas.json

// Future (production):
// Storage: PostgreSQL / MongoDB / Firebase
// Keep the same interface, just change storage backend
```

The abstraction layer makes it easy to migrate to a real database without changing the business logic.

---

## ✨ Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Summary sending to Telegram | ✅ Complete | Auto-sends with quota display |
| User history (max 10) | ✅ Complete | Persistent, queryable |
| Quota display (10/day) | ✅ Complete | Visual bar + countdown |
| History API | ✅ Complete | `/api/telegram/history` |
| Quota API | ✅ Complete | `/api/telegram/user-stats` |
| Send stats API | ✅ Complete | `/api/telegram/send-stats` |
| Telegram signature verification | ✅ Complete | HMAC-SHA256 validation |
| Storage abstraction | ✅ Complete | Ready for DB migration |

---

## 🎯 Next Steps

1. ✅ Test all endpoints with real Telegram bot
2. ✅ Verify quota tracking works correctly
3. ✅ Test history persistence across restarts
4. ✅ Integrate into Telegram Mini App frontend
5. Optional: Migrate storage to database
6. Optional: Add quota management UI in Mini App
7. Optional: Add analytics/admin dashboard

---

All Telegram features are now production-ready! 🚀

/**
 * Telegram User History Tracking
 * Stores and retrieves user summarization history (max 10 per user)
 * Uses persistent file storage for development (ready for database migration)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SummaryRecord {
  id: string; // Unique ID for this summary
  userId: string; // Telegram user ID
  summary: string; // The summary text
  keyPoints: string[]; // Key points
  originalText: string; // Original input text (first 200 chars)
  createdAt: number; // Timestamp
  createdAtDate: string; // ISO date string
}

interface UserHistory {
  userId: string;
  summaries: SummaryRecord[];
  lastUpdated: number;
}

// In-memory store for development
const historyStore = new Map<string, UserHistory>();

// Storage file path
let storageFile: string | null = null;

function getStorageFile(): string {
  if (!storageFile) {
    storageFile = path.join(os.tmpdir(), 'telegram_user_history.json');
  }
  return storageFile;
}

/**
 * Load history from persistent storage
 */
function loadHistory(): void {
  try {
    const file = getStorageFile();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      const records = JSON.parse(data) as UserHistory[];
      for (const record of records) {
        historyStore.set(record.userId, record);
      }
    }
  } catch (error) {
    console.error('Failed to load history from storage:', error);
  }
}

/**
 * Save history to persistent storage
 */
function saveHistory(): void {
  try {
    const file = getStorageFile();
    const records = Array.from(historyStore.values());
    fs.writeFileSync(file, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Failed to save history to storage:', error);
  }
}

/**
 * Initialize history storage (call once at startup)
 */
export function initializeHistoryStorage(): void {
  loadHistory();
}

/**
 * Generate a unique ID for a summary
 */
function generateSummaryId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Add a summary to user history (keeps max 10 most recent)
 */
export function addSummaryToHistory(
  userId: string,
  summary: string,
  keyPoints: string[],
  originalText: string
): SummaryRecord {
  loadHistory();

  const now = Date.now();
  const record: SummaryRecord = {
    id: generateSummaryId(),
    userId,
    summary,
    keyPoints,
    originalText: originalText.substring(0, 200), // Store first 200 chars only
    createdAt: now,
    createdAtDate: new Date(now).toISOString(),
  };

  let userHistory = historyStore.get(userId);

  if (!userHistory) {
    userHistory = {
      userId,
      summaries: [],
      lastUpdated: now,
    };
    historyStore.set(userId, userHistory);
  }

  // Add to beginning (most recent first)
  userHistory.summaries.unshift(record);

  // Keep only last 10
  if (userHistory.summaries.length > 10) {
    userHistory.summaries = userHistory.summaries.slice(0, 10);
  }

  userHistory.lastUpdated = now;
  saveHistory();

  return record;
}

/**
 * Get user's summarization history
 */
export function getUserHistory(userId: string): SummaryRecord[] {
  loadHistory();

  const userHistory = historyStore.get(userId);
  return userHistory?.summaries || [];
}

/**
 * Get a specific summary by ID
 */
export function getSummaryById(userId: string, summaryId: string): SummaryRecord | null {
  loadHistory();

  const userHistory = historyStore.get(userId);
  if (!userHistory) {
    return null;
  }

  return userHistory.summaries.find(s => s.id === summaryId) || null;
}

/**
 * Format history for Telegram display
 */
export function formatHistoryForTelegram(summaries: SummaryRecord[]): string {
  if (summaries.length === 0) {
    return '📚 <b>No History</b>\n\nYou haven\'t created any summaries yet.';
  }

  let message = `📚 <b>Your Recent Summaries</b> (${summaries.length}/10)\n\n`;

  summaries.forEach((summary, index) => {
    const date = new Date(summary.createdAt);
    const timeStr = date.toLocaleTimeString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    message += `<b>${index + 1}.</b> ${escapeHtml(summary.originalText.substring(0, 50))}...\n`;
    message += `   <i>${timeStr}</i>\n\n`;
  });

  message += '\n✨ <i>Your last 10 summaries are saved here</i>';

  return message;
}

/**
 * Format a single summary for Telegram display (with full details)
 */
export function formatDetailedSummaryForTelegram(summary: SummaryRecord): string {
  let message = '<b>📋 Summary Details</b>\n\n';

  message += `<b>Created:</b> ${new Date(summary.createdAt).toLocaleString()}\n\n`;

  message += `<b>Original Text:</b>\n<i>${escapeHtml(summary.originalText)}</i>\n\n`;

  message += `<b>Summary:</b>\n${escapeHtml(summary.summary)}\n\n`;

  message += '<b>🎯 Key Points:</b>\n';
  summary.keyPoints.forEach((point, index) => {
    message += `${index + 1}. ${escapeHtml(point)}\n`;
  });

  return message;
}

/**
 * Clear user history (admin function)
 */
export function clearUserHistory(userId: string): void {
  historyStore.delete(userId);
  saveHistory();
}

/**
 * Escape special characters for HTML formatting
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Get statistics for a user
 */
export function getUserHistoryStats(userId: string): {
  totalSummaries: number;
  oldestSummary: string | null;
  newestSummary: string | null;
} {
  loadHistory();

  const userHistory = historyStore.get(userId);
  if (!userHistory || userHistory.summaries.length === 0) {
    return {
      totalSummaries: 0,
      oldestSummary: null,
      newestSummary: null,
    };
  }

  const summaries = userHistory.summaries;
  return {
    totalSummaries: summaries.length,
    newestSummary: new Date(summaries[0].createdAt).toISOString(),
    oldestSummary: new Date(summaries[summaries.length - 1].createdAt).toISOString(),
  };
}

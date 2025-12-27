/**
 * Telegram Bot Client for sending messages
 * Uses the Telegram Bot API to send summaries to user chats
 */

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: object;
}

/**
 * Send a message to a Telegram chat with optional bot token
 */
export async function sendTelegramMessage(
  message: TelegramMessage,
  botToken?: string
): Promise<boolean> {
  // Use provided token or fall back to environment variable
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not configured, skipping Telegram message');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: message.chat_id,
        text: message.text,
        parse_mode: message.parse_mode || 'HTML',
        ...(message.reply_markup && { reply_markup: message.reply_markup }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Format a summary into a nicely formatted Telegram message
 */
export function formatSummaryForTelegram(
  summary: string,
  keyPoints: string[]
): string {
  let message = '<b>📋 Summary</b>\n\n';
  message += summary;
  message += '\n\n<b>🎯 Key Points:</b>\n';

  keyPoints.forEach((point, index) => {
    message += `${index + 1}. ${escapeHtml(point)}\n`;
  });

  return message;
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
 * Extract user ID from Telegram WebApp initData
 * This is called on the frontend and passed to the backend
 */
export function extractUserIdFromInitData(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (userParam) {
      const user = JSON.parse(userParam);
      return user.id?.toString() || null;
    }
    return null;
  } catch (error) {
    console.error('Failed to extract user ID from initData:', error);
    return null;
  }
}

/**
 * Format user quota information for Telegram display
 */
export function formatQuotaForTelegram(
  used: number,
  remaining: number,
  resetAt: string
): string {
  const DAILY_LIMIT = 10;

  let message = '<b>📊 Daily Summarization Quota</b>\n\n';

  // Quota bar
  const filledBars = Math.floor((used / DAILY_LIMIT) * 10);
  const emptyBars = 10 - filledBars;
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  const percentageUsed = Math.round((used / DAILY_LIMIT) * 100);

  message += `<code>${bar}</code>\n`;
  message += `${used}/${DAILY_LIMIT} summaries used (${percentageUsed}%)\n\n`;

  // Remaining info
  if (remaining > 0) {
    message += `✅ <b>${remaining} summarizations left today</b>\n`;
  } else {
    message += `❌ <b>Daily limit reached</b>\n`;
    message += `<i>You\'ve used all 10 summaries for today</i>\n`;
  }

  // Reset time
  const resetDate = new Date(resetAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  message += `\n⏰ <b>Resets in:</b>\n`;
  message += `${diffHours}h ${diffMins}m\n`;

  return message;
}

/**
 * Format a combined message with summary + quota info
 */
export function formatSummaryWithQuota(
  summary: string,
  keyPoints: string[],
  used: number,
  remaining: number
): string {
  let message = '<b>📋 Summary</b>\n\n';
  message += summary;
  message += '\n\n<b>🎯 Key Points:</b>\n';

  keyPoints.forEach((point, index) => {
    message += `${index + 1}. ${escapeHtml(point)}\n`;
  });

  // Add quota info
  const DAILY_LIMIT = 10;
  const filledBars = Math.floor((used / DAILY_LIMIT) * 10);
  const emptyBars = 10 - filledBars;
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

  message += `\n<b>📊 Quota:</b> <code>${bar}</code> ${used}/${DAILY_LIMIT} (${remaining} left)\n`;

  return message;
}

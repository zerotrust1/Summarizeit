/**
 * Get user's summarization history
 * Endpoint: POST /api/telegram/history
 * Returns: list of up to 10 recent summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserHistory, formatHistoryForTelegram } from '@/app/utils/telegram-history';
import { validateTelegramInitData } from '@/app/utils/telegram-verify';

interface HistoryRequest {
  initData?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { initData, userId: directUserId } = (await request.json()) as HistoryRequest;

    // Get user ID from either direct parameter or initData
    let userId: string | null = directUserId || null;

    if (!userId && initData) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const { valid, userId: extractedUserId } = validateTelegramInitData(initData, botToken);

      if (valid && extractedUserId) {
        userId = extractedUserId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine user ID' },
        { status: 400 }
      );
    }

    // Get user history
    const history = getUserHistory(userId);

    // Format for Telegram
    const telegramMessage = formatHistoryForTelegram(history);

    return NextResponse.json({
      success: true,
      userId,
      historyCount: history.length,
      maxHistory: 10,
      summaries: history.map(s => ({
        id: s.id,
        summary: s.summary,
        keyPoints: s.keyPoints,
        originalText: s.originalText,
        createdAt: s.createdAtDate,
      })),
      telegramMessage,
    });
  } catch (error) {
    console.error('History Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}

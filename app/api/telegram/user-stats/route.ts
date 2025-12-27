/**
 * Get user statistics: quota usage and history info
 * Endpoint: POST /api/telegram/user-stats
 * Returns: quota info + history summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserQuotaInfo } from '@/app/utils/user-rate-limit';
import { getUserHistory, getUserHistoryStats } from '@/app/utils/telegram-history';
import { validateTelegramInitData } from '@/app/utils/telegram-verify';
import { formatQuotaForTelegram } from '@/app/utils/telegram-client';

interface UserStatsRequest {
  initData?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { initData, userId: directUserId } = (await request.json()) as UserStatsRequest;

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

    // Get quota info
    const quotaInfo = getUserQuotaInfo(userId);
    const historyStats = getUserHistoryStats(userId);
    const history = getUserHistory(userId);

    // Format quota message for Telegram
    const quotaMessage = formatQuotaForTelegram(
      quotaInfo.used,
      quotaInfo.remaining,
      quotaInfo.resetAtDate
    );

    return NextResponse.json({
      success: true,
      userId,
      quota: {
        used: quotaInfo.used,
        remaining: quotaInfo.remaining,
        limit: 10,
        resetAt: quotaInfo.resetAtDate,
        percentageUsed: Math.round((quotaInfo.used / 10) * 100),
      },
      history: {
        total: historyStats.totalSummaries,
        max: 10,
        newest: historyStats.newestSummary,
        oldest: historyStats.oldestSummary,
        recent: history.map(s => ({
          id: s.id,
          createdAt: s.createdAtDate,
          preview: s.originalText.substring(0, 50),
        })),
      },
      telegramMessage: quotaMessage,
    });
  } catch (error) {
    console.error('User Stats Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to get user statistics' },
      { status: 500 }
    );
  }
}

/**
 * Send user statistics to Telegram chat
 * Endpoint: POST /api/telegram/send-stats
 * Sends: quota info + recent history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserQuotaInfo } from '@/app/utils/user-rate-limit';
import { getUserHistory, formatHistoryForTelegram } from '@/app/utils/telegram-history';
import { validateTelegramInitData } from '@/app/utils/telegram-verify';
import { formatQuotaForTelegram, sendTelegramMessage } from '@/app/utils/telegram-client';

interface SendStatsRequest {
  initData?: string;
  userId?: string;
  includeHistory?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { initData, userId: directUserId, includeHistory = true } = (await request.json()) as SendStatsRequest;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: 'Telegram bot not configured' },
        { status: 500 }
      );
    }

    // Get user ID from either direct parameter or initData
    let userId: string | null = directUserId || null;

    if (!userId && initData) {
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
    const quotaMessage = formatQuotaForTelegram(
      quotaInfo.used,
      quotaInfo.remaining,
      quotaInfo.resetAtDate
    );

    // Send quota message
    const quotaSent = await sendTelegramMessage(
      {
        chat_id: userId,
        text: quotaMessage,
        parse_mode: 'HTML',
      },
      botToken
    );

    if (!quotaSent) {
      return NextResponse.json(
        { error: 'Failed to send quota to Telegram' },
        { status: 500 }
      );
    }

    let historySent = false;

    // Optionally send history
    if (includeHistory) {
      const history = getUserHistory(userId);
      const historyMessage = formatHistoryForTelegram(history);

      historySent = await sendTelegramMessage(
        {
          chat_id: userId,
          text: historyMessage,
          parse_mode: 'HTML',
        },
        botToken
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      quotaSent,
      historySent: includeHistory ? historySent : null,
      message: 'Stats sent to Telegram',
    });
  } catch (error) {
    console.error('Send Stats Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to send statistics' },
      { status: 500 }
    );
  }
}

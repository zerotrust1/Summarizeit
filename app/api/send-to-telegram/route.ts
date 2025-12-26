import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatSummaryForTelegram } from '@/app/utils/telegram-client';

interface SendToTelegramRequest {
  summary: string;
  keyPoints: string[];
  chatId?: string;
  initData?: string; // Telegram WebApp initData containing user info
}

export async function POST(request: NextRequest) {
  try {
    const { summary, keyPoints, chatId, initData } = (await request.json()) as SendToTelegramRequest;

    // Validate required fields
    if (!summary || !keyPoints || keyPoints.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: summary and keyPoints' },
        { status: 400 }
      );
    }

    // Get chat ID from either direct parameter or initData
    let userId: string | null = null;

    if (chatId) {
      userId = chatId;
    } else if (initData) {
      // Extract user ID from Telegram WebApp initData
      try {
        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        if (userParam) {
          const user = JSON.parse(userParam);
          userId = user.id?.toString() || null;
        }
      } catch (error) {
        console.error('Failed to parse initData:', error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine Telegram user ID' },
        { status: 400 }
      );
    }

    // Format and send the message
    const formattedMessage = formatSummaryForTelegram(summary, keyPoints);

    const sent = await sendTelegramMessage({
      chat_id: userId,
      text: formattedMessage,
      parse_mode: 'HTML',
    });

    if (!sent) {
      console.error('Failed to send message to Telegram');
      return NextResponse.json(
        {
          error: 'Failed to send message to Telegram. Make sure TELEGRAM_BOT_TOKEN is configured.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Summary sent to Telegram',
      userId,
    });
  } catch (error) {
    console.error('Send to Telegram Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to send summary to Telegram' },
      { status: 500 }
    );
  }
}

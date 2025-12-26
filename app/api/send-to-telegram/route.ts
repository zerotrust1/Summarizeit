import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatSummaryForTelegram, extractUserIdFromInitData } from '@/app/utils/telegram-client';

interface SendToTelegramRequest {
  summary: string;
  keyPoints: string[];
  chatId?: string;
  initData?: string; // Telegram WebApp initData containing user info
}

export async function POST(request: NextRequest) {
  try {
    const { summary, keyPoints, chatId, initData } = (await request.json()) as SendToTelegramRequest;

    // TODO: Add Telegram signature verification using WebApp.initDataUnsafe
    // This will ensure the initData comes from a legitimate Telegram WebApp
    // See: https://core.telegram.org/bots/webapps#validating-data-received-from-the-web-app

    // Validate required fields
    if (
      !summary?.trim() ||
      !Array.isArray(keyPoints) ||
      keyPoints.length === 0 ||
      keyPoints.some(point => !point?.trim())
    ) {
      return NextResponse.json(
        { error: 'Invalid summary or key points' },
        { status: 400 }
      );
    }

    // Get chat ID from either direct parameter or initData
    let userId: string | null = null;

    if (chatId) {
      userId = chatId;
    } else if (initData) {
      userId = extractUserIdFromInitData(initData);
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
          error: 'Unable to send message. Please try again later.',
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

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/app/utils/rate-limit';
import { checkUserQuota } from '@/app/utils/user-rate-limit';
import { validateTelegramInitData } from '@/app/utils/telegram-verify';
import { initializeQuotaStorage } from '@/app/utils/user-rate-limit';
import { sendTelegramMessage, formatSummaryForTelegram, extractUserIdFromInitData } from '@/app/utils/telegram-client';

// Initialize quota storage on first import
initializeQuotaStorage();

// Maximum text length: 10,000 characters (~2,000 words)
const MAX_TEXT_LENGTH = 10000;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30 * 1000; // 30 seconds

interface SummarizeAndSendRequest {
  text: string;
  initData?: string;
  chatId?: string;
}

interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
  quotaRemaining?: number;
  quotaResetAt?: string;
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const { allowed, retryAfter } = checkRateLimit(request);
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter?.toString() || '900',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Limit': '100',
        },
      }
    );
  }

  let timeoutId: NodeJS.Timeout | undefined;

  try {
    const { text, initData, chatId } = (await request.json()) as SummarizeAndSendRequest;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided for summarization' },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const apiKey = process.env.OPENAI_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!apiKey) {
      console.error('[CRITICAL] OPENAI_API_KEY not configured in environment');
      console.error('To fix: Create .env.local file with OPENAI_API_KEY=your_key');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Validate text length
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed (you provided ${text.length} characters)`,
        },
        { status: 400 }
      );
    }

    // Check per-user quota if initData provided (Telegram context)
    let quotaRemaining: number | undefined;
    let quotaResetAt: string | undefined;

    if (initData) {
      const { valid, userId } = validateTelegramInitData(initData, botToken);

      if (valid && userId) {
        const quota = checkUserQuota(userId);

        if (!quota.allowed) {
          return NextResponse.json(
            {
              error: `Daily summarization limit reached. You have 10 summarizations per day. Try again after ${quota.resetAtDate}`,
              resetAt: quota.resetAtDate,
            },
            { status: 429 }
          );
        }

        quotaRemaining = quota.remaining;
        quotaResetAt = quota.resetAtDate;
      } else {
        console.warn('Invalid Telegram signature or missing user ID');
      }
    }

    // Create OpenAI client with environment key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('REQUEST_TIMEOUT'));
      }, REQUEST_TIMEOUT);
    });

    try {
      // Race between the API call and timeout
      const message = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `You are a professional summarizer. Analyze the following text and provide a response in VALID JSON format ONLY. Do not include any text before or after the JSON.

Return ONLY a JSON object with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the main content",
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"]
}

Requirements:
- The response MUST be valid JSON only
- summary must be a string (2-3 sentences)
- keyPoints must be an array of 3-5 strings
- Include no text before or after the JSON

Text to summarize:
${text}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
        timeoutPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      const content = message.choices[0].message.content;
      if (!content) {
        console.error('No content in OpenAI response');
        return NextResponse.json(
          { error: 'No response from AI' },
          { status: 500 }
        );
      }

      // Parse the JSON response with error handling
      let response: SummarizeResponse;
      try {
        response = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            response = JSON.parse(jsonMatch[0]);
          } catch {
            console.error('Failed to parse extracted JSON:', content);
            return NextResponse.json(
              { error: 'Invalid response format from AI' },
              { status: 500 }
            );
          }
        } else {
          console.error('No JSON found in AI response:', content);
          return NextResponse.json(
            { error: 'Invalid response format from AI' },
            { status: 500 }
          );
        }
      }

      // Validate response structure
      if (
        !response.summary?.trim() ||
        !Array.isArray(response.keyPoints) ||
        response.keyPoints.length === 0 ||
        response.keyPoints.some(point => !point?.trim())
      ) {
        console.error('Invalid response structure:', response);
        return NextResponse.json(
          { error: 'Invalid response format from AI' },
          { status: 500 }
        );
      }

      // Determine if we should send to Telegram
      const shouldSendToTelegram = botToken && (chatId || initData);
      let telegramSent = false;
      let telegramError: string | null = null;

      if (shouldSendToTelegram) {
        try {
          // Get chat ID from either direct parameter or initData
          let userId: string | null = chatId || null;

          if (!userId && initData) {
            userId = extractUserIdFromInitData(initData);
          }

          if (userId && botToken) {
            const formattedMessage = formatSummaryForTelegram(response.summary, response.keyPoints);
            telegramSent = await sendTelegramMessage(
              {
                chat_id: userId,
                text: formattedMessage,
                parse_mode: 'HTML',
              },
              botToken
            );

            if (!telegramSent) {
              telegramError = 'Failed to send to Telegram';
            }
          }
        } catch (telegramErr) {
          console.error('Telegram send error:', telegramErr);
          telegramError = 'Error sending to Telegram';
        }
      }

      return NextResponse.json({
        success: true,
        ...response,
        quotaRemaining,
        quotaResetAt,
        telegram: {
          sent: telegramSent,
          error: telegramError,
        },
      });
    } catch (apiError) {
      if (timeoutId) clearTimeout(timeoutId);

      // Handle timeout specifically
      if (apiError instanceof Error && apiError.message === 'REQUEST_TIMEOUT') {
        console.warn('Summarization request timed out');
        return NextResponse.json(
          { error: 'Summarization timed out. Please try with shorter text.' },
          { status: 504 }
        );
      }

      // Handle API key errors
      if (apiError instanceof Error) {
        const errorMessage = apiError.message.toLowerCase();
        if (errorMessage.includes('invalid api key') || errorMessage.includes('401') || errorMessage.includes('authentication')) {
          return NextResponse.json(
            { error: 'Invalid OpenAI API key. Please check your key and try again.' },
            { status: 401 }
          );
        }
      }

      // Log the actual error for debugging
      console.error('OpenAI API Error:', apiError instanceof Error ? apiError.message : String(apiError));
      throw apiError;
    }
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    console.error('Summarization Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to summarize text' },
      { status: 500 }
    );
  }
}

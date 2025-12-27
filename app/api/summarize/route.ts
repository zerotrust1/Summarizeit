import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/utils/openai-client';
import { checkRateLimit } from '@/app/utils/rate-limit';
import { validateSummarizeRequest, createValidationErrorResponse } from '@/app/utils/validation';
import { addSummaryToHistory, initializeHistoryStorage } from '@/app/utils/telegram-history';
import { initializeQuotaStorage } from '@/app/utils/user-rate-limit';
import { getCachedSummary, cacheResponse } from '@/app/utils/request-cache';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30 * 1000; // 30 seconds

// Initialize storage on first import
initializeQuotaStorage();
initializeHistoryStorage();

interface SummarizeRequest {
  text: string;
  initData?: string;
}

interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
  quotaRemaining?: number;
  quotaResetAt?: string;
}

export async function POST(request: NextRequest) {
  // Check rate limit (IP-based)
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
    const { text, initData } = (await request.json()) as SummarizeRequest;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Use centralized validation
    const validation = await validateSummarizeRequest(text, initData, botToken);
    if (!validation.valid) {
      return createValidationErrorResponse(validation);
    }

    const { quotaRemaining, quotaResetAt, userId } = validation;

    // Validate API key exists before proceeding
    if (!process.env.OPENAI_API_KEY) {
      console.error('[CRITICAL] OPENAI_API_KEY not configured in environment');
      console.error('To fix: Create .env.local file with OPENAI_API_KEY=your_key');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Check if result is already cached
    const cachedResult = getCachedSummary(text);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        ...cachedResult,
        quotaRemaining,
        quotaResetAt,
        cached: true,
      });
    }


    const openai = getOpenAIClient();

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('REQUEST_TIMEOUT'));
      }, REQUEST_TIMEOUT);
    });

    // Create the API call promise and register it for deduplication
    const apiPromise = openai.chat.completions.create({
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
    });

    try {
      // Race between the API call and timeout
      const message = await Promise.race([
        apiPromise,
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
        // Try direct parsing first
        response = JSON.parse(content);
      } catch {
        // If direct parsing fails, try to extract JSON from the content
        // Sometimes the AI includes extra text before/after the JSON
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

      // Cache the response for deduplication
      cacheResponse(text, {
        ...response,
        timestamp: Date.now(),
      });

      // Save to history if in Telegram context
      if (userId) {
        try {
          addSummaryToHistory(userId, response.summary, response.keyPoints, text);
        } catch (historyError) {
          console.warn('Failed to save to history:', historyError);
          // Don't fail the request if history saving fails
        }
      }

      return NextResponse.json({
        success: true,
        ...response,
        quotaRemaining,
        quotaResetAt,
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

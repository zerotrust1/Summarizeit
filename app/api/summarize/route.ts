import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/utils/openai-client';
import { checkRateLimit } from '@/app/utils/rate-limit';

// Maximum text length: 10,000 characters (~2,000 words)
const MAX_TEXT_LENGTH = 10000;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30 * 1000; // 30 seconds

interface SummarizeRequest {
  text: string;
}

interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
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

  try {
    const { text } = (await request.json()) as SummarizeRequest;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided for summarization' },
        { status: 400 }
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

    const openai = getOpenAIClient();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const message = await openai.chat.completions.create(
        {
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
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const content = message.choices[0].message.content;
      if (!content) {
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
            console.error('Failed to parse AI response:', content);
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
      if (!response.summary || !Array.isArray(response.keyPoints)) {
        console.error('Invalid response structure:', response);
        return NextResponse.json(
          { error: 'Invalid response format from AI' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        ...response,
      });
    } catch (apiError) {
      clearTimeout(timeoutId);

      // Handle timeout specifically
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Summarization timed out. Please try with shorter text.' },
          { status: 504 }
        );
      }

      throw apiError;
    }
  } catch (error) {
    console.error('Summarization Error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize text' },
      { status: 500 }
    );
  }
}

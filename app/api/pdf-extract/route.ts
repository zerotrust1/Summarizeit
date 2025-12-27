import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/utils/openai-client';
import { checkRateLimit } from '@/app/utils/rate-limit';

// Maximum file size: 30MB for PDFs
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_MIME_TYPE = 'application/pdf';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 60 * 1000; // 60 seconds (PDFs take longer)

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
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Convert file to buffer and base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Use OpenAI to extract and process PDF content with timeout
    const openai = getOpenAIClient();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are a professional PDF analyzer. Please extract and summarize the key information from this PDF file.

Provide:
1. A concise summary (3-4 sentences)
2. 5 key points from the document

Format your response as JSON:
{
  "summary": "Your summary here",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"]
}

Return ONLY valid JSON, no other text.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const content = response.choices[0].message.content?.trim();

      if (!content) {
        return NextResponse.json(
          { error: 'Failed to process PDF' },
          { status: 500 }
        );
      }

      // Parse JSON response with error handling
      let pdfResponse: { summary: string; keyPoints: string[] };
      try {
        // Try direct parsing first
        pdfResponse = JSON.parse(content);
      } catch {
        // If direct parsing fails, try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            pdfResponse = JSON.parse(jsonMatch[0]);
          } catch {
            console.error('Failed to parse PDF response:', content);
            return NextResponse.json(
              { error: 'Invalid response format from PDF processing' },
              { status: 500 }
            );
          }
        } else {
          console.error('No JSON found in PDF response:', content);
          return NextResponse.json(
            { error: 'Invalid response format from PDF processing' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        summary: pdfResponse.summary,
        keyPoints: pdfResponse.keyPoints,
      });
    } catch (apiError) {
      clearTimeout(timeoutId);

      // Handle timeout specifically
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'PDF processing timed out. Please try with a smaller PDF.' },
          { status: 504 }
        );
      }

      throw apiError;
    }
  } catch (error) {
    console.error('PDF Processing Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to process PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}

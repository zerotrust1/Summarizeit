import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    // Extract text from PDF using pdf-parse
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text.trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        { error: 'No text found in PDF. Try a different PDF.' },
        { status: 400 }
      );
    }

    // Limit extracted text to reasonable size for API (first 10,000 chars)
    const truncatedText = extractedText.substring(0, 10000);

    // Use OpenAI to summarize the extracted PDF content with timeout
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
              content: `Please summarize the following PDF content and provide key points:\n\n${truncatedText}`,
            },
          ],
          max_tokens: 1000,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const summary = response.choices[0].message.content?.trim();

      if (!summary) {
        return NextResponse.json(
          { error: 'Failed to generate summary' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        text: summary,
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

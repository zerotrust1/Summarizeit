import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/utils/openai-client';
import { checkRateLimit } from '@/app/utils/rate-limit';

// Maximum file size: 20MB for images
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30 * 1000; // 30 seconds

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
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
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
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Convert file to buffer and then to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Use OpenAI Vision API to extract text from image with timeout
    const openai = getOpenAIClient();
    
    // Create abort controller for timeout
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
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64}`,
                  },
                },
                {
                  type: 'text',
                  text: 'Please extract and return all the text you can see in this image. Return only the extracted text, nothing else.',
                },
              ],
            },
          ],
          max_tokens: 2000,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const extractedText = response.choices[0].message.content?.trim();

      if (!extractedText) {
        return NextResponse.json(
          { error: 'No text found in image. Try a clearer image.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        text: extractedText,
      });
    } catch (apiError) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Image processing timed out. Please try again with a smaller image.' },
          { status: 504 }
        );
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Image Processing Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

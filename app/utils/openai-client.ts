import OpenAI from 'openai';

/**
 * Singleton instance of OpenAI client
 * Ensures only one client is created and reused across requests
 */
let cachedClient: OpenAI | null = null;

/**
 * Get or create OpenAI client (singleton pattern)
 * This prevents creating a new client on every request
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey,
    });
  }

  return cachedClient;
}

/**
 * Reset the client (useful for testing or key rotation)
 */
export function resetOpenAIClient(): void {
  cachedClient = null;
}

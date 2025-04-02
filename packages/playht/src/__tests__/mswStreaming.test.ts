import { buffer } from 'node:stream/consumers';
import { describe, expect, it, beforeAll, afterAll, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as PlayHT from '../index';

// Mock audio data - this would normally be binary data
const mockAudioData = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt mock audio data');

// Create mock lease data
const createMockLeaseData = () => {
  // Create a buffer with mock lease data
  const buffer = Buffer.alloc(256);
  
  // Set EPOCH time (current time + 1 hour in seconds since EPOCH)
  const now = Math.floor(Date.now() / 1000);
  const oneHourLater = now + 3600;
  
  // Write created time at position 64 (4 bytes)
  buffer.writeUInt32BE(now, 64);
  
  // Write duration at position 68 (4 bytes)
  buffer.writeUInt32BE(3600, 68); // 1 hour in seconds
  
  // Write metadata as JSON at position 72
  const metadata = JSON.stringify({
    inference_address: 'mock-inference-server.play.ht:11045',
    premium_inference_address: 'mock-premium-inference-server.play.ht:11045'
  });
  Buffer.from(metadata).copy(buffer, 72);
  
  return buffer;
};

// Set up MSW server
const server = setupServer(
  // Mock the PlayDialog-turbo API endpoint
  http.post('*/v1/tts', async ({ request }) => {
    const body = (await request.json()) as any;

    // Verify request parameters
    if (body.voiceId === 'Celeste-PlayAI' &&
        body.voiceEngine === 'PlayDialog' &&
        body.quality === 'high' &&
        body.language === 'english') {
      return new HttpResponse(mockAudioData, {
        headers: {
          'Content-Type': 'audio/wav',
        },
      });
    }

    // If parameters don't match, return an error
    return new HttpResponse(JSON.stringify({ error: 'Invalid parameters' }), {
      status: 400,
    });
  }),

  // Mock the leases endpoint
  http.post('https://api.play.ht/api/v2/leases', async ({ request }) => {
    // Check for auth headers
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');
    
    if (userId === 'mock-user-id' && authHeader === 'Bearer mock-api-key') {
      // Return a mock lease binary response
      return new HttpResponse(createMockLeaseData(), {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
    }
    
    // Return error for invalid credentials
    return new HttpResponse(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
    });
  }),

  // Mock the SDK auth endpoint
  http.post('https://api.play.ht/api/v4/sdk-auth', async ({ request }) => {
    // Check for auth headers
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');
    
    if (userId === 'mock-user-id' && authHeader === 'Bearer mock-api-key') {
      // Return a mock response with inference addresses
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour
      
      return HttpResponse.json({
        'PlayDialog': {
          'http_streaming_url': 'https://mock-inference-server.play.ht/v1/tts',
          'websocket_url': 'wss://mock-inference-server.play.ht/v1/tts'
        },
        'Play3.0-mini': {
          'http_streaming_url': 'https://mock-inference-server.play.ht/v1/tts',
          'websocket_url': 'wss://mock-inference-server.play.ht/v1/tts'
        },
        'PlayDialogArabic': {
          'http_streaming_url': 'https://mock-inference-server.play.ht/v1/tts',
          'websocket_url': 'wss://mock-inference-server.play.ht/v1/tts'
        },
        'PlayDialogMultilingual': {
          'http_streaming_url': 'https://mock-inference-server.play.ht/v1/tts',
          'websocket_url': 'wss://mock-inference-server.play.ht/v1/tts'
        },
        'expires_at': expiresAt.toISOString()
      });
    }
    
    // Return error for invalid credentials
    return new HttpResponse(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
    });
  }),

  // Catch-all handler for any unhandled requests
  http.all('*', async ({ request }) => {
    console.error(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.error();
  })
);

describe('MSW Streaming', () => {
  // Start MSW server before tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Close server after all tests
  afterAll(() => server.close());

  describe('PlayDialog-turbo', () => {
    it('streams from text with mocked API', async () => {
      // Initialize PlayHT with mock credentials
      PlayHT.init({
        userId: 'mock-user-id',
        apiKey: 'mock-api-key',
      });

      // Call the stream function with the same parameters as in e2eStreaming.test.ts
      const streamFromText = await PlayHT.stream('Hey Turbo', {
        voiceEngine: 'PlayDialog',
        voiceId: 'Celeste-PlayAI',
        quality: 'high',
        language: 'english',
      });

      // Get the buffer from the stream
      const audioBuffer = await buffer(streamFromText);

      // Verify the audio data
      expect(audioBuffer.length).toBeGreaterThan(0);
      expect(audioBuffer.toString('ascii')).toContain('RIFF\u007F\u007F\u007F\u007FWAVEfmt');
    });

    it('handles API errors gracefully', async () => {
      PlayHT.init({
        userId: 'mock-user-id',
        apiKey: 'mock-api-key',
      });

      // Use incorrect parameters to trigger an error
      await expect(PlayHT.stream('Hey Turbo', {
        voiceEngine: 'PlayDialog',
        voiceId: 'Wrong-Voice-ID',
        quality: 'high',
        language: 'english',
      })).rejects.toThrow();
    });
  });
});

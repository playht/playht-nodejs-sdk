import { buffer } from 'node:stream/consumers';
import { describe, expect, it, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as PlayHT from '../index';

// Mock audio data - this would normally be binary data
const mockAudioData = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt mock audio data');

// Set up MSW server
const server = setupServer(
  // Mock the PlayDialog-turbo API endpoint
  http.post('*/v1/tts', async ({ request }) => {
    const body = await request.json();
    
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
  
  // Catch-all handler for any unhandled requests
  http.all('*', ({ request }) => {
    console.error(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.error();
  })
);

// Set longer timeout for all tests in this file
jest.setTimeout(30000);

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
      expect(audioBuffer.toString('ascii')).toContain('RIFF');
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

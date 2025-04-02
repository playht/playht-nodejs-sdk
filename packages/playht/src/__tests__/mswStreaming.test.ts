import { buffer } from 'node:stream/consumers';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as PlayHT from '../index';
import { __createLeasesMwsEndpointHandler } from './helpers/leases/createLeasesMswEndpointHandler';

// Mock audio data - this would normally be binary data
const mockAudioData = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt mock audio data');

describe('Streaming (Mocked)', () => {
  //#region MSW Server
  const server = setupServer(
    __createLeasesMwsEndpointHandler('mock-user-id', 'mock-api-key'),

    // Mock the PlayDialog-turbo API endpoint
    http.post('https://api.play.ht/api/v2/tts/stream', async ({ request }) => {
      const body = (await request.json()) as any;

      console.log(JSON.stringify(body, null, 2));

      expect(JSON.parse(JSON.stringify(body))).toStrictEqual({
        text: 'Hey Turbo',
        voice_engine: 'PlayDialog-turbo',
        voice: 'Celeste-PlayAI',
        language: 'english',
      });

      return new HttpResponse(mockAudioData, {
        headers: {
          'Content-Type': 'audio/wav',
        },
      });
    }),

    http.post('https://api.play.ht/api/v4/sdk-auth', async ({ request }) => {
      // Check for auth headers
      const userId = request.headers.get('x-user-id');
      const authHeader = request.headers.get('authorization');

      if (userId === 'mock-user-id' && authHeader === 'Bearer mock-api-key') {
        // Return a mock response with inference addresses
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

        return HttpResponse.json({
          PlayDialog: {
            http_streaming_url: 'https://mock-inference-server.play.ht/v1/tts',
            websocket_url: 'wss://mock-inference-server.play.ht/v1/tts',
          },
          'Play3.0-mini': {
            http_streaming_url: 'https://mock-inference-server.play.ht/v1/tts',
            websocket_url: 'wss://mock-inference-server.play.ht/v1/tts',
          },
          PlayDialogArabic: {
            http_streaming_url: 'https://mock-inference-server.play.ht/v1/tts',
            websocket_url: 'wss://mock-inference-server.play.ht/v1/tts',
          },
          PlayDialogMultilingual: {
            http_streaming_url: 'https://mock-inference-server.play.ht/v1/tts',
            websocket_url: 'wss://mock-inference-server.play.ht/v1/tts',
          },
          expires_at: expiresAt.toISOString(),
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
    }),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  //#endregion MSW Server

  describe('PlayDialog-turbo', () => {
    it('streams as usual', async () => {
      PlayHT.init({
        userId: 'mock-user-id',
        apiKey: 'mock-api-key',
      });

      // execute:
      const streamFromText = await PlayHT.stream(
        'Hey Turbo',
        {
          voiceEngine: 'PlayDialog-turbo',
          voiceId: 'Celeste-PlayAI',
          language: 'english',
        },
        // @ts-expect-error experimental settings are not exposed in the public API
        {
          settings: {
            experimental: {
              defaultPlayDialogToPlayDialogTurbo: false,
            },
          },
        },
      );

      // verify:
      const audioBuffer = await buffer(streamFromText);
      expect(audioBuffer).toEqual(mockAudioData);
    });

    it('streams if PlayDialog and defaultPlayDialogToPlayDialogTurbo have been specified', async () => {
      // setup:
      PlayHT.init({
        userId: 'mock-user-id',
        apiKey: 'mock-api-key',
      });

      // execute:
      const streamFromText = await PlayHT.stream(
        'Hey Turbo',
        {
          voiceEngine: 'PlayDialog',
          voiceId: 'Celeste-PlayAI',
          language: 'english',
        },
        // @ts-expect-error experimental settings are not exposed in the public API
        {
          settings: {
            experimental: {
              defaultPlayDialogToPlayDialogTurbo: true,
            },
          },
        },
      );

      // verify:
      const audioBuffer = await buffer(streamFromText);
      expect(audioBuffer).toEqual(mockAudioData);
    });
  });
});

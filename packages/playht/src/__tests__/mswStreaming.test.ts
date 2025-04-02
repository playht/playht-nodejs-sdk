import { buffer } from 'node:stream/consumers';
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as PlayHT from '../index';
import { __createLeasesMwsEndpointHandler } from './helpers/leases/createLeasesMswEndpointHandler';

// Mock audio data for tests
const playDialogTurboAudioResponse = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt playDialogTurboAudioResponse');

describe('Streaming (Mocked)', () => {
  // Set longer timeout for all tests in this file
  jest.setTimeout(30000);
  
  //#region MSW Server
  const server = setupServer(
    __createLeasesMwsEndpointHandler('mock-user-id', 'mock-api-key'),

    http.post('https://api.play.ht/api/v2/tts/stream', async ({ request }) => {
      const body = JSON.parse(JSON.stringify(await request.json()));

      expect(body).toStrictEqual({
        text: 'Hey Turbo',
        voice_engine: 'PlayDialog-turbo',
        voice: 'Celeste-PlayAI',
        language: 'english',
      });

      return new HttpResponse(playDialogTurboAudioResponse, { headers: { 'Content-Type': 'audio/wav' } });
    }),
    
    // Mock the inference server endpoint (returned from sdk-auth)
    http.post('https://mock-inference-server.play.ht/v1/tts', async ({ request }) => {
      const body = await request.json() as any;
      
      // Verify the request parameters for PlayDialog
      if (body.text === 'Hey Turbo' && 
          body.voice_id === 'Celeste-PlayAI') {
        return new HttpResponse(playDialogTurboAudioResponse, {
          headers: {
            'Content-Type': 'audio/wav',
          },
        });
      }
      
      // If parameters don't match, return an error
      return new HttpResponse(JSON.stringify({ error: 'Invalid inference server parameters' }), {
        status: 400,
      });
    }),

    http.post('https://api.play.ht/api/v4/sdk-auth', async ({ request }) => {
      expect(request.headers.get('x-user-id')).toBe('mock-user-id');
      expect(request.headers.get('authorization')).toBe('mock-api-key');

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
        expires_at: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString(), // Expires in 1 hour
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
      expect(audioBuffer).toEqual(playDialogTurboAudioResponse);
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
          voiceId: 's3://voice-cloning-zero-shot/24507c14-c743-4943-80db-a1e16248309a/original/manifest.json', // Celeste
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
      expect(audioBuffer).toEqual(playDialogTurboAudioResponse);
    });
  });
  describe('PlayDialog', () => {
    it('streams as PlayDialog if defaultPlayDialogToPlayDialogTurbo have been specified', async () => {
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
          voiceId: 's3://voice-cloning-zero-shot/24507c14-c743-4943-80db-a1e16248309a/original/manifest.json', // Celeste
          language: 'english',
        },
        // @ts-expect-error experimental settings are not exposed in the public API
        {
          settings: {
            experimental: {
              // defaultPlayDialogToPlayDialogTurbo --> not specified (default)
            },
          },
        },
      );

      // verify:
      const audioBuffer = await buffer(streamFromText);
      expect(audioBuffer).toEqual(playDialogTurboAudioResponse);
    });
  });
});

import { buffer } from 'node:stream/consumers';
import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as PlayHT from '../index';
import { __createLeasesMwsEndpointHandler } from './helpers/leases/createLeasesMswEndpointHandler';

const playDialogAudioResponse = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt playDialogAudioResponse');
const playDialogTurboAudioResponse = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt playDialogTurboAudioResponse');

describe('Streaming (Mocked)', () => {
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

    http.post('https://mock-inference-server.play.ht/v1/other/tts/stream', async ({ request }) => {
      const body = JSON.parse(JSON.stringify(await request.json()));

      expect(body).toStrictEqual({
        text: 'Hey Turbo',
        voice_engine: 'PlayDialog',
        voice: 's3://voice-cloning-zero-shot/24507c14-c743-4943-80db-a1e16248309a/original/manifest.json',
        language: 'english',
      });

      return new HttpResponse(playDialogAudioResponse, { headers: { 'Content-Type': 'audio/wav' } });
    }),

    http.post('https://api.play.ht/api/v4/sdk-auth', async ({ request }) => {
      expect(request.headers.get('x-user-id')?.toString()).toBe('mock-user-id');
      expect(request.headers.get('authorization')?.toString()).toBe('Bearer mock-api-key');

      return HttpResponse.json({
        PlayDialog: {
          http_streaming_url: 'https://mock-inference-server.play.ht/v1/other/tts/stream',
          websocket_url: 'wss://mock-inference-server.play.ht/v1/other/tts/stream',
        },
        'Play3.0-mini': {
          http_streaming_url: 'https://mock-inference-server.play.ht/v1/other/tts/stream',
          websocket_url: 'wss://mock-inference-server.play.ht/v1/other/tts/stream',
        },
        PlayDialogArabic: {
          http_streaming_url: 'https://mock-inference-server.play.ht/v1/other/tts/stream',
          websocket_url: 'wss://mock-inference-server.play.ht/v1/other/tts/stream',
        },
        PlayDialogMultilingual: {
          http_streaming_url: 'https://mock-inference-server.play.ht/v1/other/tts/stream',
          websocket_url: 'wss://mock-inference-server.play.ht/v1/other/tts/stream',
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
      try {
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
        expect(audioBuffer).toEqual(playDialogAudioResponse);
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });
});

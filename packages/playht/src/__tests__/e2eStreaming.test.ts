import { buffer } from 'node:stream/consumers';
import fs from 'node:fs';
import { Readable } from 'stream';
import { describe, expect, it } from '@jest/globals';
import * as PlayHT from '../index';
import { SDKSettings } from '../api/APISettingsStore';
import { E2E_CONFIG } from './e2eTestConfig';

describe('E2E', () => {
  describe('tts streaming', () => {
    describe('Standard', () => {
      xit('streams from text', async () => {
        PlayHT.init({
          userId: E2E_CONFIG.USER_ID,
          apiKey: E2E_CONFIG.API_KEY,
        });

        const streamFromText = await PlayHT.stream('Hello from SDK test, standard.', {
          voiceEngine: 'Standard',
          voiceId: 'en-US-JennyNeural',
        });

        const audioBuffer = await buffer(streamFromText);
        fs.writeFileSync('test-output-Standard--no-git.mp3', audioBuffer); // for debugging

        expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      }, 20_000);
    });

    describe('PlayHT1.0', () => {
      it('streams from text', async () => {
        PlayHT.init({
          userId: E2E_CONFIG.USER_ID,
          apiKey: E2E_CONFIG.API_KEY,
        });

        const streamFromText = await PlayHT.stream('Hello from SDK test, one point oh.', {
          voiceEngine: 'PlayHT1.0',
          outputFormat: 'mp3',
        });

        const audioBuffer = await buffer(streamFromText);
        fs.writeFileSync('test-output-PlayHT1.0--no-git.mp3', audioBuffer); // for debugging

        expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
        expect(audioBuffer.toString('ascii')).toContain('ID3');
      });
    });
  });

  xdescribe('PlayHT2.0-turbo [DOESNT WORK, BUT HERE FOR TYPE CHECKS]', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
      });

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'PlayHT2.0-turbo',
        outputFormat: 'wav',
        emotion: 'female_surprised',
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayHT2.0-turbo.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    });
  });

  describe('Play3.0-mini', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
        debug: {
          enabled: true,
        },
      });

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'Play3.0-mini',
        outputFormat: 'mp3',

        // @ts-expect-error emotion is not part of the Play3.0-mini contract
        emotion: 'female_surprised',
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-Play3.0-mini.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    });
  });

  describe('PlayDialog', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
        debug: {
          enabled: true,
        },
      });

      const streamFromText = await PlayHT.stream('Host 1: Is this the SDK?\nHost 2: Yes, it is.', {
        voiceEngine: 'PlayDialog',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        voiceId2: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
        turnPrefix: 'Host 1:',
        turnPrefix2: 'Host 2:',
        language: 'english',

        // @ts-expect-error emotion and language are not part of the PlayDialog contract
        emotion: 'female_surprised',
        styleGuidance: 16,
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayDialog.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 120_000);
  });

  describe('PlayDialogArabic', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
        debug: {
          enabled: true,
        },
      });

      const streamFromText = await PlayHT.stream('Host 1: هل هذا هو SDK؟\nHost 2: نعم، هو.', {
        voiceEngine: 'PlayDialog',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        voiceId2: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
        turnPrefix: 'Host 1:',
        turnPrefix2: 'Host 2:',
        language: 'arabic',
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayDialog-arabic.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 120_000);
  });

  describe('PlayDialogHindi', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
        debug: {
          enabled: true,
        },
      });

      const streamFromText = await PlayHT.stream('Host 1: क्या यह SDK है?\nHost 2: हाँ, यह है।', {
        voiceEngine: 'PlayDialog',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        voiceId2: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
        turnPrefix: 'Host 1:',
        turnPrefix2: 'Host 2:',
        language: 'hindi',
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayDialog-hindi.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 120_000);
  });

  describe('PlayDialogMultilingual', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
        debug: {
          enabled: true,
        },
      });

      const streamFromText = await PlayHT.stream(
        'Host 1: Estamos todos prontos para fazer o que for necessário aqui. Host 2: É impossível esquecer tudo que vivemos.',
        {
          voiceEngine: 'PlayDialog',
          outputFormat: 'mp3',
          temperature: 1.2,
          quality: 'high',
          voiceId2: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
          turnPrefix: 'Host 1:',
          turnPrefix2: 'Host 2:',
          language: 'portuguese',

          // @ts-expect-error emotion and language are not part of the PlayDialog contract
          emotion: 'female_surprised',
          styleGuidance: 16,
        },
      );

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayDialogMultilingual.mp3', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 120_000);
  });

  describe('PlayDialog-turbo', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
      });

      const p = PlayHT.stream('Hey Turbo', {
        voiceEngine: 'PlayDialog-turbo',
        voiceId: 'Celeste-PlayAI',
        quality: 'high',
        language: 'english',
      });
      const streamFromText = await p;

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('test-output-PlayDialogTurbo--no-git.wav', audioBuffer); // for debugging

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('RIFF\u007F\u007F\u007F\u007FWAVEfmt');
    }, 120_000);
  });

  describe('Advanced Config', () => {
    describe('axiosClient', () => {
      it('overwrites default axios client for streaming requests', async () => {
        try {
          PlayHT.init({
            userId: E2E_CONFIG.USER_ID,
            apiKey: E2E_CONFIG.API_KEY,
          });
          const audioResponse = Buffer.from('RIFF\u007F\u007F\u007F\u007FWAVEfmt axiosAudioResponse');
          const settings: Partial<SDKSettings> = {
            advanced: {
              axiosClient: async (input) => {
                expect(input.headers).toStrictEqual({
                  accept: 'audio/mpeg',
                  'content-type': 'application/json',
                  AUTHORIZATION: E2E_CONFIG.API_KEY,
                  'X-USER-ID': E2E_CONFIG.USER_ID,
                });

                expect(input.data).toStrictEqual({
                  text: 'Hey Turbo',
                  voice_engine: 'PlayHT1.0',
                  voice: 's3://voice-cloning-zero-shot/some-voice-afw59j/manifest.json',
                  quality: 'high',
                  output_format: 'mp3',
                  speed: 1,
                  sample_rate: 24000,
                  seed: undefined,
                  emotion: undefined,
                  style_guidance: undefined,
                  temperature: undefined,
                  text_guidance: undefined,
                  voice_guidance: undefined,
                });

                return {
                  data: Readable.from(audioResponse),
                  headers: {},
                  status: 200,
                };
              },
            },
          };
          const p = PlayHT.stream(
            'Hey Turbo',
            {
              voiceEngine: 'PlayHT1.0',
              voiceId: 's3://voice-cloning-zero-shot/some-voice-afw59j/manifest.json',
              quality: 'high',
            },
            // @ts-expect-error experimental settings are not exposed in the public API
            { settings },
          );
          const streamFromText = await p;

          const audioBuffer = await buffer(streamFromText);
          expect(audioBuffer).toStrictEqual(audioResponse);
        } catch (e) {
          console.log(e);
          throw e;
        }
      });
    });
  });
});

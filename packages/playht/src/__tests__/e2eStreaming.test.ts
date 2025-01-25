import { buffer } from 'node:stream/consumers';
import fs from 'node:fs';
import { describe, expect, it } from '@jest/globals';
import * as PlayHT from '../index';
import { E2E_CONFIG } from './e2eTestConfig';

describe('E2E Streaming', () => {
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
      });

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'Play3.0-mini',
        outputFormat: 'pcm',

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

  describe('PlayDialogMultilingual', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
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
});

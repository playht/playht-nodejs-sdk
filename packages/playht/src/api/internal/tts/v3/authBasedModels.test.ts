import { buffer } from 'node:stream/consumers';
import { describe, expect, it } from '@jest/globals';
import * as PlayHT from '../../../../index';
import { E2E_CONFIG } from '../../../../__tests__/e2eTestConfig';

describe('Auth-Based Models', () => {
  describe('Play3.0-mini', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
      });

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'Play3.0-mini',
        outputFormat: 'mp3',
       });

      const audioBuffer = await buffer(streamFromText);
      // fs.writeFileSync('Play3.0-mini.mp3', audioBuffer); // uncomment this line to save the generated file

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

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'PlayDialog',
        language: 'english',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        // @ts-expect-error emotion is not part of the Play3.0-mini contract
        emotion: 'not-used',
        styleGuidance: 16,
      });

      const audioBuffer = await buffer(streamFromText);
      // fs.writeFileSync('PlayDialog.mp3', audioBuffer); // uncomment this line to save the generated file

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 20_000);
  });
});

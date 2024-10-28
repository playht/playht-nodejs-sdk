import { buffer } from 'node:stream/consumers';
import fs from 'node:fs';
import { describe, expect, it } from '@jest/globals';
import * as PlayHT from '../index';
import { E2E_CONFIG } from './e2eTestConfig';

describe('E2E Streaming', () => {
  describe('Play3.0-mini', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
      });

      const streamFromText = await PlayHT.stream('Hello from SDK test.', {
        voiceEngine: 'Play3.0-mini',
        // @ts-expect-error emotion is not part of the Play3.0-mini contract
        emotion: 'not-used',
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

      const streamFromText = await PlayHT.stream('Host 1: Is this the SDK?\nHost 2: Yes, it is.', {
        voiceEngine: 'PlayDialog',
        // @ts-expect-error language is not part of the PlayDialog contract
        language: 'english',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        emotion: 'not-used',
        styleGuidance: 16,
        voiceId2: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
        turnPrefix: 'Host 1:',
        turnPrefix2: 'Host 2:',
        // TODO TS should be complaining here
        foobarbaz: 'dummy',
      });

      const audioBuffer = await buffer(streamFromText);
      fs.writeFileSync('PlayDialog.mp3', audioBuffer); // uncomment this line to save the generated file

      expect(audioBuffer.length).toBeGreaterThan(30_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    }, 120_000);
  });
});

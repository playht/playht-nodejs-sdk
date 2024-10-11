import { buffer } from 'node:stream/consumers';
import { describe, expect, it } from '@jest/globals';
import * as PlayHT from '../../index';
import { E2E_CONFIG } from '../../__tests__/e2eTestConfig';

describe('v3', () => {
  describe('Play3.0-mini', () => {
    it('streams from text', async () => {
      PlayHT.init({
        userId: E2E_CONFIG.USER_ID,
        apiKey: E2E_CONFIG.API_KEY,
      });

      const streamFromText = await PlayHT.stream('Hello from SDK e2e test.', {
        voiceEngine: 'Play3.0-mini',
        outputFormat: 'mp3',
        temperature: 1.2,
        quality: 'high',
        emotion: 'male_fearful',
        styleGuidance: 16,
      });

      const audioBuffer = await buffer(streamFromText);
      // fs.writeFileSync('Play3.0-mini.mp3', audioBuffer); // uncomment this line to save the generated file

      expect(audioBuffer.length).toBeGreaterThan(50_000); // errors would result in smaller payloads
      expect(audioBuffer.toString('ascii')).toContain('ID3');
    });
  });
});

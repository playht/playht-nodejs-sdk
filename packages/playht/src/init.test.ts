import { describe, expect, test } from '@jest/globals';
import * as PlayHTAPI from './index';

describe('exists', () => {
  test('PlayHTAPI', () => {
    expect(PlayHTAPI).toBeDefined();
    expect(PlayHTAPI.init).toBeDefined();
    expect(typeof PlayHTAPI.generateSpeech).toBe('function');
  });
});

import { describe, expect, test } from '@jest/globals';
import * as PlayHT from './index';

describe('exists', () => {
  test('PlayHT', () => {
    expect(PlayHT).toBeDefined();
    expect(PlayHT.init).toBeDefined();
    expect(typeof PlayHT.generate).toBe('function');
    expect(typeof PlayHT.stream).toBe('function');
    expect(typeof PlayHT.clone).toBe('function');
  });
});

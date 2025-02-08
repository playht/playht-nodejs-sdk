import { describe, expect, it } from '@jest/globals';
import { getInternalEngineForEndpoint } from './generateAuthBasedStream';

describe('getInternalEngineForEndpoint', () => {
  it('returns Play3.0-mini for Play3.0-mini engine', () => {
    const options = { voiceEngine: 'Play3.0-mini' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('Play3.0-mini');
  });

  it('returns PlayDialog for PlayDialog engine with no language', () => {
    const options = { voiceEngine: 'PlayDialog' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialog');
  });

  it('returns PlayDialogArabic for PlayDialog engine with arabic language', () => {
    const options = { voiceEngine: 'PlayDialog', language: 'arabic' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogArabic');
  });

  it('returns PlayDialogMultilingual for PlayDialog engine with non-english language', () => {
    const options = { voiceEngine: 'PlayDialog', language: 'spanish' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogMultilingual');
  });
});

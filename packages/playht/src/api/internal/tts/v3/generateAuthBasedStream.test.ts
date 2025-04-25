import { describe, expect, it } from '@jest/globals';
import { getInternalEngineForEndpoint } from './generateAuthBasedStream';

describe('getInternalEngineForEndpoint', () => {
  const dummyOptions: Omit<Parameters<typeof getInternalEngineForEndpoint>[0], 'voiceEngine'> = { voice: 'dummy' };

  it('returns Play3.0-mini for Play3.0-mini engine', () => {
    const options = { ...dummyOptions, voiceEngine: 'Play3.0-mini' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('Play3.0-mini');
  });

  it('returns PlayDialogLora for PlayDialog engine with HFVC', () => {
    const options = {
      ...dummyOptions,
      voiceEngine: 'PlayDialog',
      voice: 's3://play-fal/ldm-lora-training/foo',
    } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogLora');
  });

  it('returns PlayDialog for PlayDialog engine with no language', () => {
    const options = { ...dummyOptions, voiceEngine: 'PlayDialog' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialog');
  });

  it('returns PlayDialogArabic for PlayDialog engine with arabic language', () => {
    const options = { ...dummyOptions, voiceEngine: 'PlayDialog', language: 'arabic' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogArabic');
  });

  it('returns PlayDialogHindi for PlayDialog engine with hindi language', () => {
    const options = { ...dummyOptions, voiceEngine: 'PlayDialog', language: 'hindi' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogHindi');
  });

  it('returns PlayDialogMultilingual for PlayDialog engine with non-english language', () => {
    const options = { ...dummyOptions, voiceEngine: 'PlayDialog', language: 'spanish' } as const;
    const result = getInternalEngineForEndpoint(options);
    expect(result).toBe('PlayDialogMultilingual');
  });
});

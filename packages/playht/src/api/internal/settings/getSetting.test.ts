import { getSetting } from './getSetting';

describe('getSetting', () => {
  it('should handle simple case', () => {
    type Data = {
      fieldA: string | null;
    };
    const aaaData: Data = {
      fieldA: 'from-aaa',
    };
    const bbbData: Data = {
      fieldA: null,
    };

    expect(getSetting('fieldA', bbbData, null, undefined, aaaData)).toBe('from-aaa');
    expect(getSetting('fieldA', aaaData, null, undefined, bbbData)).toBe('from-aaa');
    expect(getSetting('fieldA', null, aaaData, undefined, bbbData)).toBe('from-aaa');
  });

  // Define test data
  const defaultSettings = {
    stringOption: 'default-string',
    numberOption: 42,
    boolOption: false,
    objectOption: { key: 'default' },
    nestedOption: { deep: { value: 'default-nested' } },
  };

  const apiSettings = {
    stringOption: 'api-string',
    numberOption: 100,
    objectOption: { key: 'api' },
  };

  const requestSettings = {
    stringOption: 'request-string',
    boolOption: true,
  };

  it('should return value from first source if available', () => {
    expect(getSetting('stringOption', requestSettings, apiSettings, defaultSettings)).toBe('request-string');
    expect(getSetting('boolOption', requestSettings, apiSettings, defaultSettings)).toBe(true);
  });

  it('should fall back to second source if first does not have value', () => {
    expect(getSetting('numberOption', requestSettings, apiSettings, defaultSettings)).toBe(100);
    expect(getSetting('objectOption', requestSettings, apiSettings, defaultSettings)).toEqual({ key: 'api' });
  });

  it('should use default if no other sources have value', () => {
    expect(getSetting('nestedOption', requestSettings, apiSettings, defaultSettings)).toEqual({
      deep: { value: 'default-nested' },
    });
  });

  it('should handle null and undefined sources', () => {
    expect(getSetting('stringOption', null, undefined, defaultSettings)).toBe('default-string');
    expect(getSetting('numberOption', undefined, null, defaultSettings)).toBe(42);
  });

  it('should handle empty sources', () => {
    expect(getSetting('stringOption', {}, {}, defaultSettings)).toBe('default-string');
  });

  it('should handle sources with nullish values', () => {
    const nullishValues = {
      stringOption: null,
      numberOption: undefined,
    };

    expect(getSetting('stringOption', nullishValues, apiSettings, defaultSettings)).toBe('api-string');
    expect(getSetting('numberOption', nullishValues, apiSettings, defaultSettings)).toBe(100);
  });

  it('should match behavior of nullish coalescing operator', () => {
    // Setup similar to the original code example
    const V3_DEFAULT_SETTINGS = {
      coordinatesExpirationMinimalFrequencyMs: 5000,
      coordinatesExpirationAdvanceRefreshTimeMs: 2000,
    };

    const APISettingsStore = {
      getSettings: () => ({
        experimental: {
          v3: {
            coordinatesExpirationMinimalFrequencyMs: 6000,
          } as typeof V3_DEFAULT_SETTINGS | null,
        },
      }),
    };

    const reqConfigSettings: ReturnType<(typeof APISettingsStore)['getSettings']> = {
      experimental: {
        v3: null,
      },
    };

    // Original approach with nullish coalescing
    const originalValue =
      reqConfigSettings?.experimental?.v3?.coordinatesExpirationMinimalFrequencyMs ??
      APISettingsStore.getSettings().experimental?.v3?.coordinatesExpirationMinimalFrequencyMs ??
      V3_DEFAULT_SETTINGS.coordinatesExpirationMinimalFrequencyMs;

    // New approach with getSetting
    const newValue = getSetting(
      'coordinatesExpirationMinimalFrequencyMs',
      reqConfigSettings?.experimental?.v3,
      APISettingsStore.getSettings().experimental?.v3,
      V3_DEFAULT_SETTINGS,
    );

    // Values should be the same
    expect(newValue).toBe(originalValue);
    expect(newValue).toBe(6000);
  });
});

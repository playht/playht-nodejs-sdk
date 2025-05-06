import { beforeEach, describe, expect, jest } from '@jest/globals';
import { UserId } from '../../types';
import { expectToBeDateCloseToNow } from '../../../../__tests__/helpers/expectToBeDateCloseToNow';
import { APISettingsStore, SDKSettings } from '../../../APISettingsStore';
import {
  __clearInferenceCoordinatesStoreForAllUsers,
  __inspectInferenceCoordinatesStoreForUser,
  AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS,
  AUTO_CLEANUP_WORKER_INTERVAL_MS,
  clearInferenceCoordinatesStoreForUser,
  createOrGetInferenceAddress,
} from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine, V3InternalSettings } from './V3InternalSettings';

async function sleep(timeout: number) {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

describe('createOrGetInferenceAddress', () => {
  beforeAll(() => {
    // Equivalent to PlayHT.init()
    APISettingsStore.setSettings({
      userId: 'not-used',
      apiKey: 'not-used',
      debug: {
        enabled: true,
      },
    });
  });
  let callSequenceNumber: number;
  beforeEach(() => {
    callSequenceNumber = 0;
  });
  const reqConfigSettings = (
    userId: string,
    options: {
      expirationDiffMs?: number;
      forcedError?: Error;
      coordinatesAheadOfTimeAutoRefresh?: boolean;
      customInferenceCoordinatesGenerator?: V3InternalSettings['customInferenceCoordinatesGenerator'];
      customRetryDelay?: V3InternalSettings['customRetryDelay'];
      coordinatesUsableThresholdTimeMs?: number;
      autoCleanupUnusedCoordinates?: boolean;
    } = {},
  ): SDKSettings => ({
    userId,
    apiKey: 'test-api-key',
    defaultVoiceId: 'foo-default-voice-id',
    defaultVoiceEngine: 'Standard',
    experimental: {
      v3: {
        customInferenceCoordinatesGenerator:
          options.customInferenceCoordinatesGenerator ??
          (async (_: InternalAuthBasedEngine, u: string) => {
            await sleep(10); // simulate a delay
            if (options.forcedError) {
              throw options.forcedError;
            }
            return {
              inferenceAddress: `call ${u} #${++callSequenceNumber}`,
              expiresAtMs: Date.now() + (options.expirationDiffMs ?? 1_000_000),
            };
          }),
        coordinatesAheadOfTimeAutoRefresh: options.coordinatesAheadOfTimeAutoRefresh ?? false,
        coordinatesExpirationMinimalFrequencyMs: 0,
        coordinatesExpirationAdvanceRefreshTimeMs: 0,
        coordinatesGetApiCallMaxRetries: 0,
        coordinatesUsableThresholdTimeMs: 56_123,
        customRetryDelay: options.customRetryDelay,
        autoCleanupUnusedCoordinates: options.autoCleanupUnusedCoordinates ?? false,
      },
    },
    debug: {
      enabled: true,
    },
  });

  afterEach(() => {
    __clearInferenceCoordinatesStoreForAllUsers();
  });

  it('serializes concurrent calls for the same user', async () => {
    const numberOfTestCalls = 15;
    const calls = Array.from({ length: numberOfTestCalls }, () =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings('test-user-111')),
    );

    // Expect all calls to return 'call #1', not 'call #1', 'call #2', 'call #3', etc.
    expect(await Promise.all(calls)).toEqual(Array(numberOfTestCalls).fill('call test-user-111 #1'));
  });

  it('doesnt serialize calls for different users', async () => {
    const numberOfTestCalls = 3;
    const callsOne = Array.from({ length: numberOfTestCalls }, (_, i) =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(`test-user-222#${i}`)),
    );
    const callsTwo = Array.from({ length: numberOfTestCalls }, (_, i) =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(`test-user-222#${i}`)),
    );

    expect(await Promise.all([...callsOne, ...callsTwo])).toEqual([
      'call test-user-222#0 #1',
      'call test-user-222#1 #2',
      'call test-user-222#2 #3',
      'call test-user-222#0 #1',
      'call test-user-222#1 #2',
      'call test-user-222#2 #3',
    ]);
  });

  describe('clearInferenceCoordinatesStoreForUser', () => {
    afterEach(() => {
      __clearInferenceCoordinatesStoreForAllUsers();
    });

    it('clears the inference coordinates store for the given user', async () => {
      const userId = 'tc-user-333' as UserId;
      await createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(userId));
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        'Play3.0-mini': {
          coordinates: {
            expiresAtMs: expectToBeDateCloseToNow(),
            inferenceAddress: 'call tc-user-333 #1',
          },
          autoCleanupIfUnused: false,
          lastUsedAt: expectToBeDateCloseToNow(),
        },
      });
      await createOrGetInferenceAddress('PlayDialogArabic', reqConfigSettings(userId));
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        'Play3.0-mini': {
          coordinates: {
            expiresAtMs: expectToBeDateCloseToNow(),
            inferenceAddress: 'call tc-user-333 #1',
          },
          autoCleanupIfUnused: false,
          lastUsedAt: expectToBeDateCloseToNow(),
        },
        PlayDialogArabic: {
          coordinates: {
            expiresAtMs: expectToBeDateCloseToNow(),
            inferenceAddress: 'call tc-user-333 #2',
          },
          autoCleanupIfUnused: false,
          lastUsedAt: expectToBeDateCloseToNow(),
        },
      });
      clearInferenceCoordinatesStoreForUser(userId);
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({});
    });

    it('updates lastUsedAt on cache hit', async () => {
      const userId = 'lastUsed-user-test' as UserId;
      const config = reqConfigSettings(userId, { expirationDiffMs: 1_000_000 });

      // Initial call - caches
      await createOrGetInferenceAddress('Play3.0-mini', config);
      const initialCache = (__inspectInferenceCoordinatesStoreForUser(userId) as any)['Play3.0-mini']; // Need access to internal structure
      const initialLastUsed = initialCache.lastUsedAt.getTime();

      await sleep(20);

      // Second call - cache hit
      await createOrGetInferenceAddress('Play3.0-mini', config);
      const updatedCache = (__inspectInferenceCoordinatesStoreForUser(userId) as any)['Play3.0-mini'];
      const updatedLastUsed = updatedCache.lastUsedAt.getTime();

      expect(updatedLastUsed).toBeGreaterThan(initialLastUsed);
    });

    it('honors expiration threshold', async () => {
      const paddingMs = 2; // typically the time you'd expect these functions to run (1ms is already A LOT!)
      const userId = 'threshold-user-444' as UserId;
      const r0 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { expirationDiffMs: -56_123 + paddingMs }),
      );
      expect(r0).toBe('call threshold-user-444 #1'); // first call
      const r1 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, {
          forcedError: new Error('should not have been called because previous auth hasnt expired'),
        }),
      );
      expect(r1).toBe('call threshold-user-444 #1'); // first call, still
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        PlayDialog: {
          coordinates: {
            expiresAtMs: expectToBeDateCloseToNow(56_123 + paddingMs),
            inferenceAddress: 'call threshold-user-444 #1',
          },
          autoCleanupIfUnused: false,
          lastUsedAt: expectToBeDateCloseToNow(),
        },
      });

      clearInferenceCoordinatesStoreForUser(userId);

      const r2 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { expirationDiffMs: -56_123 - paddingMs }),
      );
      expect(r2).toBe('call threshold-user-444 #2'); // second call, but token should be expired next

      const r3Promise = createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { forcedError: new Error('should attempt to refresh and fail') }),
      );
      await expect(r3Promise).rejects.toThrow('should attempt to refresh and fail');
      // attempt above, which found the token expired, should have cleared the store
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({});
    });

    it('refreshes ahead of time', async () => {
      const paddingMs = 2; // typically the time you'd expect these functions to run (1ms is already A LOT!)
      const userId = 'ahead-user-555' as UserId;
      const r0 = await createOrGetInferenceAddress(
        'PlayDialog',
        // notice that this generates a token that will be VERY EXPIRED :D
        reqConfigSettings(userId, { expirationDiffMs: -999999 + paddingMs, coordinatesAheadOfTimeAutoRefresh: true }),
      );
      expect(r0).toBe('call ahead-user-555 #1'); // first call
      await sleep(20); // leave some time for the auto-refresh interval to kick in
      // now verify that the inference address has changed on its own, even though we never called createOrGetInferenceAddress ourselves
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        PlayDialog: {
          coordinates: {
            expiresAtMs: expectToBeDateCloseToNow(9999999),
            inferenceAddress: 'call ahead-user-555 #2',
          },
          autoCleanupIfUnused: false,
          lastUsedAt: expectToBeDateCloseToNow(),
        },
      });
    });
  });

  describe('failures', () => {
    afterEach(() => {
      __clearInferenceCoordinatesStoreForAllUsers();
    });

    it('surfaces errors if it is from first call', async () => {
      const configSettings = reqConfigSettings('test-user-666', {
        customRetryDelay: () => 10,
      });
      configSettings.experimental!.v3!.customInferenceCoordinatesGenerator = async (_, u) => {
        throw new Error(`first call error for ${u}`);
      };
      const req = createOrGetInferenceAddress('Play3.0-mini', configSettings);

      await expect(req).rejects.toThrow('first call error for test-user-666');
    });
    it('logs errors if it is from other calls', async () => {
      const configSettings = reqConfigSettings('test-user-777', {
        coordinatesAheadOfTimeAutoRefresh: true,
        customInferenceCoordinatesGenerator: async () => {
          callNo++;
          if (callNo === 1) {
            return {
              inferenceAddress: 'first-call successful',
              expiresAtMs: Date.now(), // can refresh right away
            };
          }
          throw new Error(`non-first call error #${callNo}`);
        },
        customRetryDelay: () => 10,
      });
      let callNo = 0;
      configSettings.experimental!.v3!.coordinatesGetApiCallMaxRetries = 3;
      configSettings.debug!.info = jest.fn();
      configSettings.debug!.warn = jest.fn();
      configSettings.debug!.error = jest.fn();

      const req = createOrGetInferenceAddress('Play3.0-mini', configSettings);
      await sleep(100);

      const debugInfoCalls = (configSettings.debug!.info as jest.Mock).mock.calls;
      const debugWarnCalls = (configSettings.debug!.warn as jest.Mock).mock.calls;
      const debugErrorCalls = (configSettings.debug!.error as jest.Mock).mock.calls;

      expect(debugInfoCalls).toHaveLength(0);
      expect(debugWarnCalls).toHaveLength(2);
      expect((debugWarnCalls[0]![1] as any).event).toBe('failed-obtaining-credentials');
      expect((debugWarnCalls[0]![1] as any).error.message).toBe(`non-first call error #2`);
      expect((debugWarnCalls[1]![1] as any).event).toBe('failed-obtaining-credentials');
      expect((debugWarnCalls[1]![1] as any).error.message).toBe(`non-first call error #3`);
      expect(debugErrorCalls).toHaveLength(1);
      expect((debugErrorCalls[0]![1] as any).event).toBe('given-up-obtaining-credentials');
      expect((debugErrorCalls[0]![1] as any).error.message).toBe(`non-first call error #4`);

      await expect(req).resolves.toBe('first-call successful');
    });
  });

  describe('auto-cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
      __clearInferenceCoordinatesStoreForAllUsers();
    });

    const autoCleanupConfig: Parameters<typeof reqConfigSettings>[1] = {
      coordinatesAheadOfTimeAutoRefresh: false,
      autoCleanupUnusedCoordinates: true,
      customInferenceCoordinatesGenerator: async () => ({
        inferenceAddress: 'dummy',
        expiresAtMs: Date.now() + 999_999_999, // some time in the very distant future
      }),
    };
    it('clears unused coordinates after 2 hours if enabled', async () => {
      const userId = 'cleanup-user-888-1' as UserId;
      const config = reqConfigSettings(userId, autoCleanupConfig);

      // this call will start the cleanup worker
      await createOrGetInferenceAddress('Play3.0-mini', config);
      // at this point we should have some coordinates cached
      expect(__inspectInferenceCoordinatesStoreForUser(userId)['Play3.0-mini']).not.toBeNull();

      // advance time just past the cleanup threshold + interval check, and then run cleanup
      jest.advanceTimersByTime(AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS + AUTO_CLEANUP_WORKER_INTERVAL_MS + 1);
      jest.runOnlyPendingTimers();

      // verify it has been cleared
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({});
    });

    it('does NOT clear coordinates if autoCleanupUnusedCoordinates is false', async () => {
      const userId = 'cleanup-user-888-2' as UserId;
      const config = reqConfigSettings(userId, {
        ...autoCleanupConfig,
        autoCleanupUnusedCoordinates: false,
      });

      await createOrGetInferenceAddress('Play3.0-mini', config);
      expect(__inspectInferenceCoordinatesStoreForUser(userId)['Play3.0-mini']).not.toBeNull();

      jest.advanceTimersByTime(AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS + AUTO_CLEANUP_WORKER_INTERVAL_MS + 1);
      jest.runOnlyPendingTimers();

      expect(__inspectInferenceCoordinatesStoreForUser(userId)).not.toStrictEqual({});
    });

    it('does NOT clear recently used coordinates even if autoClear is enabled', async () => {
      const userId = 'cleanup-user-888-3' as UserId;
      const config = reqConfigSettings(userId, autoCleanupConfig);

      await createOrGetInferenceAddress('Play3.0-mini', config);
      expect(__inspectInferenceCoordinatesStoreForUser(userId)['Play3.0-mini']).not.toBeNull();

      // advance time, but not enough to trigger cleanup
      const threshold = 10000;
      jest.advanceTimersByTime(AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS - threshold);

      // trigger a cache hit to update lastUsedAt
      await createOrGetInferenceAddress('Play3.0-mini', config);

      // advance time past the original cleanup threshold + interval check, and run cleanup
      jest.advanceTimersByTime(threshold + AUTO_CLEANUP_WORKER_INTERVAL_MS + 1);
      jest.runOnlyPendingTimers();

      // should still exist because it was used recently
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).not.toStrictEqual({});

      // advance time well past the cleanup threshold + interval check, and run cleanup function
      jest.advanceTimersByTime(AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS + AUTO_CLEANUP_WORKER_INTERVAL_MS + 1);
      jest.runOnlyPendingTimers();

      // this time it should be cleared
      expect(__inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({});
    });
  });
});

import { beforeEach, describe, expect } from '@jest/globals';
import { UserId } from '../../types';
import { expectToBeDateCloseToNow } from '../../../../__tests__/helpers/expectToBeDateCloseToNow';
import {
  _inspectInferenceCoordinatesStoreForUser,
  clearInferenceCoordinatesStoreForUser,
  createOrGetInferenceAddress
} from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine } from './V3InternalSettings';

async function sleep(timeout: number) {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

describe('createOrGetInferenceAddress', () => {
  let callSequenceNumber: number;
  beforeEach(() => {
    callSequenceNumber = 0;
  });
  const reqConfigSettings = (userId: string, options: {
    expirationDiffMs?: number;
    forcedError?: Error
  } = { }) => ({
    userId,
    apiKey: 'test-api-key',
    experimental: {
      v3: {
        customInferenceCoordinatesGenerator: async (_: InternalAuthBasedEngine, u: string) => {
          await sleep(10); // simulate a delay
          if (options.forcedError) {
            throw options.forcedError;
          }
          return {
            inferenceAddress: `call ${u} #${++callSequenceNumber}`,
            expiresAtMs: Date.now() + (options.expirationDiffMs ?? 1_000_000),
          };
        },
        coordinatesExpirationMinimalFrequencyMs: 0,
        coordinatesExpirationAdvanceRefreshTimeMs: 0,
        coordinatesGetApiCallMaxRetries: 0,
        coordinatesUsableThresholdTimeMs: 56_123,
      },
    },
  });

  it('serializes concurrent calls for the same user', async () => {
    const numberOfTestCalls = 15;
    const calls = Array.from({ length: numberOfTestCalls }, () =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings('test-user')),
    );

    // Expect all calls to return 'call #1', not 'call #1', 'call #2', 'call #3', etc.
    expect(await Promise.all(calls)).toEqual(Array(numberOfTestCalls).fill('call test-user #1'));
  });

  it('doesnt serialize calls for different users', async () => {
    const numberOfTestCalls = 3;
    const callsOne = Array.from({ length: numberOfTestCalls }, (_, i) =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(`test-user#${i}`)),
    );
    const callsTwo = Array.from({ length: numberOfTestCalls }, (_, i) =>
      createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(`test-user#${i}`)),
    );

    expect(await Promise.all([...callsOne, ...callsTwo])).toEqual([
      'call test-user#0 #1',
      'call test-user#1 #2',
      'call test-user#2 #3',
      'call test-user#0 #1',
      'call test-user#1 #2',
      'call test-user#2 #3',
    ]);
  });

  describe('clearInferenceCoordinatesStoreForUser', () => {
    it('clears the inference coordinates store for the given user', async () => {
      const userId = 'test-user' as UserId;
      await createOrGetInferenceAddress('Play3.0-mini', reqConfigSettings(userId));
      expect(_inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        "Play3.0-mini": {
          "expiresAtMs": expectToBeDateCloseToNow(),
          "inferenceAddress": "call test-user #1"
        }
      });
      await createOrGetInferenceAddress('PlayDialogArabic', reqConfigSettings(userId));
      expect(_inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({
        "Play3.0-mini": {
          "expiresAtMs": expectToBeDateCloseToNow(),
          "inferenceAddress": "call test-user #1"
        },
        "PlayDialogArabic": {
          "expiresAtMs": expectToBeDateCloseToNow(),
          "inferenceAddress": "call test-user #2"
        }
      });
      clearInferenceCoordinatesStoreForUser(userId);
      expect(_inspectInferenceCoordinatesStoreForUser(userId)).toStrictEqual({});
    });

    it('honors expiration threshold', async () => {
      const paddingMs = 2; // typically the time you'd expect these functions to run (1ms is already A LOT!)
      const userId = 'test-user' as UserId;
      const r0 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { expirationDiffMs: -56_123 + paddingMs }),
      );
      expect(r0).toBe('call test-user #1'); // first call
      const r1 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, {
          forcedError: new Error('should not have been called because previous auth hasnt expired'),
        }),
      );
      expect(r1).toBe('call test-user #1'); // first call, still

      clearInferenceCoordinatesStoreForUser(userId);

      const r2 = await createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { expirationDiffMs: -56_123 - paddingMs }),
      );
      expect(r2).toBe('call test-user #2'); // second call, but token should be expired next

      const r3Promise = createOrGetInferenceAddress(
        'PlayDialog',
        reqConfigSettings(userId, { forcedError: new Error('should attempt to refresh and fail') }),
      );
      await expect(r3Promise).rejects.toThrow('should attempt to refresh and fail');
    });
  });
});

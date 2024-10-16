import { describe, expect } from '@jest/globals';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

async function sleep(timeout: number) {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

describe('createOrGetInferenceAddress', () => {
  let callSequenceNumber = 0;
  const reqConfigSettings = (userId: string) => ({
    userId,
    apiKey: 'test',
    experimental: {
      v3: {
        customInferenceCoordinatesGenerator: async () => {
          await sleep(10); // simulate a delay
          return {
            inferenceAddress: `call ${userId} #${++callSequenceNumber}`,
            expiresAtMs: Date.now() + 1_000_000,
          };
        },
        coordinatesExpirationMinimalFrequencyMs: 0,
        coordinatesExpirationAdvanceRefreshTimeMs: 0,
        coordinatesGetApiCallMaxRetries: 0,
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
      'call test-user#0 #2',
      'call test-user#1 #3',
      'call test-user#2 #4',
      'call test-user#0 #2',
      'call test-user#1 #3',
      'call test-user#2 #4',
    ]);
  });
});

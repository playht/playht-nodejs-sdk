import { InferenceCoordinatesEntry } from './v3/v3Overrides';

/**
 * Internal SDK injection point for PlayHT SDK extensions.
 *
 * This object allows extending/overriding the default implementation of some of the SDK capabilities
 * without having to rebuild or modify the SDK itself.
 */
export const PlayHTSdkOverrides = {
  v3: {
    COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS: 300_000, // 5 minutes
    COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS: 60_000, // refresh no more frequently than 1 minute
    COORDINATES_GET_API_CALL_MAX_RETRIES: 3, // number of attempts when calling API to get new coordinates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    inferenceCoordinatesGenerator: async (userId: string, apiKey: string): Promise<InferenceCoordinatesEntry> => {
      throw Error('v3.inferenceCoordinatesGenerator not initialized');
    },
  },
};

import { InferenceCoordinatesEntry } from './v3/v3Extensions';

/**
 * Internal SDK injection point for PlayHT SDK extensions.
 *
 * This object allows extending/overriding the default implementation of some of the SDK capabilities
 * without having to rebuild or modify the SDK itself.
 */
export const PlayHTSdkOverrides = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  v3InferenceCoordinatesGenerator: async (userId: string, apiKey: string): Promise<InferenceCoordinatesEntry> => {
    throw Error('v3InferenceCoordinatesGenerator not initialized');
  },
};

import axios from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { convertError } from '../../convertError';
import { PLAY_SDK_VERSION } from '../../sdkVersion';
import {
  InferenceCoordinatesEntry,
  InternalAuthBasedEngine,
  V3InternalSettings,
  V3InternalSettingsWithDefaults,
} from './V3InternalSettings';

// By default, the inference coordinates generator will call the Play API to get the inference coordinates.
const defaultInferenceCoordinatesGenerator: V3InternalSettings['customInferenceCoordinatesGenerator'] = async (
  engine,
  userId,
  apiKey,
): Promise<InferenceCoordinatesEntry> => {
  const data = await axios
    .post(
      'https://api.play.ht/api/v4/sdk-auth',
      {},
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
          'x-user-id': userId,
          'x-play-sdk-version': PLAY_SDK_VERSION,
        },
        httpsAgent: keepAliveHttpsAgent,
      },
    )
    .then(
      (response) =>
        response.data as Record<InternalAuthBasedEngine, { http_streaming_url: string; websocket_url: string }> & {
          expires_at: string; // ISO Date string, e.g., "2025-02-08T02:09:53.499Z"
        },
    )
    .catch((error: any) => convertError(error));
  const httpStreamingUrl = data[engine]?.http_streaming_url;
  if (!httpStreamingUrl) {
    return convertError(new Error(`Engine ${engine} not found in AUTH response`));
  }
  return {
    inferenceAddress: httpStreamingUrl,
    expiresAtMs: new Date(data.expires_at).getTime(),
  };
};

export const V3_DEFAULT_SETTINGS: V3InternalSettingsWithDefaults = {
  // Automatically refresh the coordinates ahead of time
  coordinatesAheadOfTimeAutoRefresh: true,
  // Try to refresh the coordinates 5 minutes before they expire
  coordinatesExpirationAdvanceRefreshTimeMs: 300_000,
  // Refresh no more frequently than 1 minute
  coordinatesExpirationMinimalFrequencyMs: 60_000,
  // Attempt to get new coordinates 3 times max
  coordinatesGetApiCallMaxRetries: 3,
  // Already treat coordinates as expired if their expiration date is before 30s from now
  coordinatesUsableThresholdTimeMs: 30_000, // 30 seconds
  // Custom function to generate inference coordinates
  customInferenceCoordinatesGenerator: defaultInferenceCoordinatesGenerator,
  // Use exponential backoff
  customRetryDelay: (attemptNo) => {
    const calculatedDelay = 3 ** attemptNo * 500;
    const randomSum = calculatedDelay * 0.2 * Math.random(); // 0-20% of the delay
    return calculatedDelay + randomSum;
  },
  // For the general user, always keep the coordinates
  autoCleanupUnusedCoordinates: false,
};

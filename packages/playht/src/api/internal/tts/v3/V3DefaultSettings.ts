import { V3InternalSettings } from './V3InternalSettings';

export const V3_DEFAULT_SETTINGS = {
  // Try to refresh the coordinates 5 minutes before they expire
  coordinatesExpirationAdvanceRefreshTimeMs: 300_000,
  // Refresh no more frequently than 1 minute
  coordinatesExpirationMinimalFrequencyMs: 60_000,
  // Attempt to get new coordinates 3 times max
  coordinatesGetApiCallMaxRetries: 3,
  // Already treat coordinates as expired if their expiration date is before 30s from now
  coordinatesUsableThresholdTimeMs: 30_000, // 30 seconds
  customInferenceCoordinatesGenerator: undefined,
} satisfies V3InternalSettings;

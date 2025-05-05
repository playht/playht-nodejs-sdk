/**
 * "Public" because these are the engines the users can choose from.
 */
export type PublicAuthBasedEngine = 'Play3.0-mini' | 'PlayDialog';

/**
 * "Internal" because these are the engines we use internally to determine the inference address (the HTTP endpoint).
 */
export type InternalAuthBasedEngine =
  | PublicAuthBasedEngine
  | 'PlayDialogArabic'
  | 'PlayDialogHindi'
  | 'PlayDialogLora'
  | 'PlayDialogMultilingual';

export type V3InternalSettings = {
  // If the SDK should automatically try to refresh the coordinates before they expire (default: true)
  coordinatesAheadOfTimeAutoRefresh?: boolean;
  // how much time before expiration should we refresh the coordinates
  coordinatesExpirationAdvanceRefreshTimeMs?: number;
  // refresh no more frequently than this
  coordinatesExpirationMinimalFrequencyMs?: number;
  // number of attempts when calling API to get new coordinates
  coordinatesGetApiCallMaxRetries?: number;
  // Time in ms that we should consider an entry of auth coordinates still usable;
  // e.g., if we set this to 10_000ms, and the token will expire in 9_000s, we already consider it unusable/expired.
  coordinatesUsableThresholdTimeMs?: number;
  customInferenceCoordinatesGenerator?: (
    engine: InternalAuthBasedEngine,
    userId: string,
    apiKey: string,
  ) => Promise<InferenceCoordinatesEntry>;
  customRetryDelay?: (attemptNo: number) => number;
};

export interface V3InternalSettingsWithDefaults extends V3InternalSettings {
  coordinatesExpirationAdvanceRefreshTimeMs: number;
  coordinatesExpirationMinimalFrequencyMs: number;
  coordinatesGetApiCallMaxRetries: number;
  coordinatesUsableThresholdTimeMs: number;
  customInferenceCoordinatesGenerator: NonNullable<V3InternalSettings['customInferenceCoordinatesGenerator']>;
  customRetryDelay: NonNullable<V3InternalSettings['customRetryDelay']>;
}

export type InferenceCoordinatesEntry = {
  inferenceAddress: string;
  expiresAtMs: number;
};

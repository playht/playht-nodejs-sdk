export type V3InternalSettings = {
  // how much time before expiration should we refresh the coordinates
  coordinatesExpirationAdvanceRefreshTimeMs?: number;
  // refresh no more frequently than this
  coordinatesExpirationMinimalFrequencyMs?: number;
  // number of attempts when calling API to get new coordinates
  coordinatesGetApiCallMaxRetries?: number;
  customInferenceCoordinatesGenerator?: (
    engine: 'Play3.0-mini' | 'PlayDialog',
    userId: string,
    apiKey: string,
  ) => Promise<InferenceCoordinatesEntry>;
};

export type AuthBasedEngine = 'PlayDialog' | 'Play3.0-mini';

export type InferenceCoordinatesEntry = {
  inferenceAddress: string;
  expiresAtMs: number;
};

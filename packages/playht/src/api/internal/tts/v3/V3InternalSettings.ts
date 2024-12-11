/**
 * "Public" because these are the engines the users can choose from.
 */
export type PublicAuthBasedEngine = 'Play3.0-mini' | 'PlayDialog';

/**
 * "Internal" because these are the engines we use internally to determine the inference address (the HTTP endpoint).
 */
export type InternalAuthBasedEngine = PublicAuthBasedEngine | 'PlayDialogMultilingual';

export type V3InternalSettings = {
  // how much time before expiration should we refresh the coordinates
  coordinatesExpirationAdvanceRefreshTimeMs?: number;
  // refresh no more frequently than this
  coordinatesExpirationMinimalFrequencyMs?: number;
  // number of attempts when calling API to get new coordinates
  coordinatesGetApiCallMaxRetries?: number;
  customInferenceCoordinatesGenerator?: (
    engine: InternalAuthBasedEngine,
    userId: string,
    apiKey: string,
  ) => Promise<InferenceCoordinatesEntry>;
};

export type InferenceCoordinatesEntry = {
  inferenceAddress: string;
  expiresAtMs: number;
};

export type V3InternalSettings = {
  // how much time before expiration should we refresh the coordinates
  coordinatesExpirationAdvanceRefreshTimeMs?: number;
  // refresh no more frequently than this
  COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS?: number;
  // number of attempts when calling API to get new coordinates
  COORDINATES_GET_API_CALL_MAX_RETRIES?: number;
  customInferenceCoordinatesGenerator?: (userId: string, apiKey: string) => Promise<InferenceCoordinatesEntry>;
};

export type InferenceCoordinatesEntry = {
  inferenceAddress: string;
  expiresAtMs: number;
};

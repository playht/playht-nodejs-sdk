import axios from 'axios';
import { convertError } from '../internal/convertError';
import { keepAliveHttpsAgent } from '../internal/http';
import { PlayRequestConfig } from '../config/PlayRequestConfig';
import { APISettingsStore } from '../APISettingsStore';
import { InferenceCoordinatesEntry } from './V3InternalSettings';
import { V3_DEFAULT_SETTINGS } from './V3DefaultSettings';

const inferenceCoordinatesStore: Record<string, InferenceCoordinatesEntry> = {};

// By default, the inference coordinates generator will call the Play API to get the inference coordinates.
const defaultInferenceCoordinatesGenerator = async (
  userId: string,
  apiKey: string,
): Promise<InferenceCoordinatesEntry> => {
  const data = await axios
    .post(
      'https://api.play.ht/api/v3/auth',
      {},
      {
        headers: {
          'x-user-id': userId,
          authorization: `Bearer ${apiKey}`,
        },
        httpsAgent: keepAliveHttpsAgent,
      },
    )
    .then(
      (response) =>
        response.data as {
          inference_address: string;
          expires_at_ms: number;
        },
    )
    .catch((error: any) => convertError(error));
  return {
    inferenceAddress: data.inference_address,
    expiresAtMs: data.expires_at_ms,
  };
};

async function createInferenceCoordinates(
  reqConfig: PlayRequestConfig,
  attemptNo = 0,
): Promise<InferenceCoordinatesEntry> {
  const userId = reqConfig?.settings?.userId ?? APISettingsStore.getSettings().userId;
  const apiKey = reqConfig?.settings?.apiKey ?? APISettingsStore.getSettings().apiKey;
  const inferenceCoordinatesGenerator =
    reqConfig?.settings?.experimental?.v3?.customInferenceCoordinatesGenerator ??
    APISettingsStore.getSettings().experimental?.v3?.customInferenceCoordinatesGenerator ??
    defaultInferenceCoordinatesGenerator;
  const coordinatesExpirationMinimalFrequencyMs =
    reqConfig?.settings?.experimental?.v3?.COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS ??
    APISettingsStore.getSettings().experimental?.v3?.COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS ??
    V3_DEFAULT_SETTINGS.COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS;
  const coordinatesExpirationAdvanceRefreshTimeMs =
    reqConfig?.settings?.experimental?.v3?.COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS ??
    APISettingsStore.getSettings().experimental?.v3?.COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS ??
    V3_DEFAULT_SETTINGS.COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS;
  const coordinatesGetApiCallMaxRetries =
    reqConfig?.settings?.experimental?.v3?.COORDINATES_GET_API_CALL_MAX_RETRIES ??
    APISettingsStore.getSettings().experimental?.v3?.COORDINATES_GET_API_CALL_MAX_RETRIES ??
    V3_DEFAULT_SETTINGS.COORDINATES_GET_API_CALL_MAX_RETRIES;

  try {
    const newInferenceCoordinatesEntry = await inferenceCoordinatesGenerator(userId, apiKey);
    const automaticRefreshDelay = Math.max(
      coordinatesExpirationMinimalFrequencyMs,
      newInferenceCoordinatesEntry.expiresAtMs - Date.now() - coordinatesExpirationAdvanceRefreshTimeMs,
    );
    setTimeout(() => createInferenceCoordinates(reqConfig), automaticRefreshDelay).unref();
    inferenceCoordinatesStore[userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (e) {
    if (attemptNo >= coordinatesGetApiCallMaxRetries) {
      throw e;
    }
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(createInferenceCoordinates(reqConfig, attemptNo + 1));
        },
        500 * (attemptNo + 1),
      ).unref();
    });
  }
}

export async function createOrGetInferenceAddress(reqConfig: PlayRequestConfig): Promise<string> {
  const userId = reqConfig?.settings?.userId ?? APISettingsStore.getSettings().userId;
  const inferenceCoordinatesEntry = inferenceCoordinatesStore[userId];
  if (inferenceCoordinatesEntry && inferenceCoordinatesEntry.expiresAtMs >= Date.now() - 5_000) {
    return inferenceCoordinatesEntry.inferenceAddress;
  } else {
    const newInferenceCoordinatesEntry = await createInferenceCoordinates(reqConfig);
    return newInferenceCoordinatesEntry.inferenceAddress;
  }
}

import axios from 'axios';
import { convertError } from '../../convertError';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { APISettingsStore } from '../../../APISettingsStore';
import { UserId } from '../../types';
import { InferenceCoordinatesEntry } from './V3InternalSettings';
import { V3_DEFAULT_SETTINGS } from './V3DefaultSettings';

const inferenceCoordinatesStore: Record<UserId, InferenceCoordinatesEntry> = {};

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

const createInferenceCoordinates = async (
  reqConfigSettings?: PlayRequestConfig['settings'],
  attemptNo = 0,
): Promise<InferenceCoordinatesEntry> => {
  const userId = (reqConfigSettings?.userId ?? APISettingsStore.getSettings().userId) as UserId;
  const apiKey = reqConfigSettings?.apiKey ?? APISettingsStore.getSettings().apiKey;
  const inferenceCoordinatesGenerator =
    reqConfigSettings?.experimental?.v3?.customInferenceCoordinatesGenerator ??
    APISettingsStore.getSettings().experimental?.v3?.customInferenceCoordinatesGenerator ??
    defaultInferenceCoordinatesGenerator;
  const coordinatesExpirationMinimalFrequencyMs =
    reqConfigSettings?.experimental?.v3?.coordinatesExpirationMinimalFrequencyMs ??
    APISettingsStore.getSettings().experimental?.v3?.coordinatesExpirationMinimalFrequencyMs ??
    V3_DEFAULT_SETTINGS.coordinatesExpirationMinimalFrequencyMs;
  const coordinatesExpirationAdvanceRefreshTimeMs =
    reqConfigSettings?.experimental?.v3?.coordinatesExpirationAdvanceRefreshTimeMs ??
    APISettingsStore.getSettings().experimental?.v3?.coordinatesExpirationAdvanceRefreshTimeMs ??
    V3_DEFAULT_SETTINGS.coordinatesExpirationAdvanceRefreshTimeMs;
  const coordinatesGetApiCallMaxRetries =
    reqConfigSettings?.experimental?.v3?.coordinatesGetApiCallMaxRetries ??
    APISettingsStore.getSettings().experimental?.v3?.coordinatesGetApiCallMaxRetries ??
    V3_DEFAULT_SETTINGS.coordinatesGetApiCallMaxRetries;

  try {
    const newInferenceCoordinatesEntry = await inferenceCoordinatesGenerator(userId, apiKey);
    const automaticRefreshDelay = Math.max(
      coordinatesExpirationMinimalFrequencyMs,
      newInferenceCoordinatesEntry.expiresAtMs - Date.now() - coordinatesExpirationAdvanceRefreshTimeMs,
    );
    setTimeout(() => createInferenceCoordinates(reqConfigSettings), automaticRefreshDelay).unref();
    inferenceCoordinatesStore[userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (e) {
    if (attemptNo >= coordinatesGetApiCallMaxRetries) {
      throw e;
    }
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(createInferenceCoordinates(reqConfigSettings, attemptNo + 1));
        },
        500 * (attemptNo + 1),
      ).unref();
    });
  }
};

const inferenceCoordinatesCreationPromise: Record<UserId, Promise<InferenceCoordinatesEntry>> = {};

export const createOrGetInferenceAddress = async (
  reqConfigSettings?: PlayRequestConfig['settings'],
): Promise<string> => {
  const userId = (reqConfigSettings?.userId ?? APISettingsStore.getSettings().userId) as UserId;
  const inferenceCoordinatesEntry = inferenceCoordinatesStore[userId];
  if (inferenceCoordinatesEntry && inferenceCoordinatesEntry.expiresAtMs >= Date.now() - 5_000) {
    return inferenceCoordinatesEntry.inferenceAddress;
  } else {
    if (!(userId in inferenceCoordinatesCreationPromise)) {
      inferenceCoordinatesCreationPromise[userId] = createInferenceCoordinates(reqConfigSettings);
    }
    const newInferenceCoordinatesEntry = (await inferenceCoordinatesCreationPromise[userId])!;
    delete inferenceCoordinatesCreationPromise[userId];
    return newInferenceCoordinatesEntry.inferenceAddress;
  }
};

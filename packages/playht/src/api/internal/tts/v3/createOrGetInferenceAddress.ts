import axios from 'axios';
import { convertError } from '../../convertError';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { APISettingsStore } from '../../../APISettingsStore';
import { UserId } from '../../types';
import { getSetting } from '../../settings/getSetting';
import { InferenceCoordinatesEntry, InternalAuthBasedEngine, V3InternalSettings } from './V3InternalSettings';
import { V3_DEFAULT_SETTINGS } from './V3DefaultSettings';

const inferenceCoordinatesStores: Record<InternalAuthBasedEngine, Record<UserId, InferenceCoordinatesEntry>> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogMultilingual: {},
};

export const clearInferenceCoordinatesStoreForUser = (userId: UserId): void => {
  for (const engine in inferenceCoordinatesStores) {
    delete inferenceCoordinatesStores[engine as keyof typeof inferenceCoordinatesStores][userId];
  }
};
export const _inspectInferenceCoordinatesStoreForUser = (userId: UserId) => {
  const result: Record<InternalAuthBasedEngine, InferenceCoordinatesEntry | null> = {} as any;
  for (const engine in inferenceCoordinatesStores) {
    const typedEngine = engine as keyof typeof inferenceCoordinatesStores;
    const value = inferenceCoordinatesStores[typedEngine][userId];
    if (value) result[typedEngine] = value;
  }
  return result;
};

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
          'x-user-id': userId,
          authorization: `Bearer ${apiKey}`,
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

const createInferenceCoordinates = async (
  voiceEngine: InternalAuthBasedEngine,
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
    const newInferenceCoordinatesEntry = await inferenceCoordinatesGenerator(voiceEngine, userId, apiKey);
    const automaticRefreshDelay = Math.max(
      coordinatesExpirationMinimalFrequencyMs,
      newInferenceCoordinatesEntry.expiresAtMs - Date.now() - coordinatesExpirationAdvanceRefreshTimeMs,
    );
    setTimeout(() => createInferenceCoordinates(voiceEngine, reqConfigSettings), automaticRefreshDelay).unref();
    inferenceCoordinatesStores[voiceEngine][userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (e) {
    if (attemptNo >= coordinatesGetApiCallMaxRetries) {
      throw e;
    }
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(createInferenceCoordinates(voiceEngine, reqConfigSettings, attemptNo + 1));
        },
        500 * (attemptNo + 1),
      ).unref();
    });
  }
};

const inferenceCoordinatesCreationPromise: Record<UserId, Promise<InferenceCoordinatesEntry>> = {};

export const createOrGetInferenceAddress = async (
  voiceEngine: InternalAuthBasedEngine,
  reqConfigSettings?: PlayRequestConfig['settings'],
): Promise<string> => {
  const userId = (reqConfigSettings?.userId ?? APISettingsStore.getSettings().userId) as UserId;
  const inferenceCoordinatesEntry = inferenceCoordinatesStores[voiceEngine][userId];

  const coordinatesUsableThresholdTimeMs = getSetting(
    'coordinatesUsableThresholdTimeMs',
    reqConfigSettings?.experimental?.v3,
    APISettingsStore.getSettings().experimental?.v3,
    V3_DEFAULT_SETTINGS,
  );

  if (
    inferenceCoordinatesEntry &&
    inferenceCoordinatesEntry.expiresAtMs >= Date.now() - coordinatesUsableThresholdTimeMs
  ) {
    return inferenceCoordinatesEntry.inferenceAddress;
  } else {
    if (!(userId in inferenceCoordinatesCreationPromise)) {
      inferenceCoordinatesCreationPromise[userId] = createInferenceCoordinates(voiceEngine, reqConfigSettings);
    }
    const newInferenceCoordinatesEntry = (await inferenceCoordinatesCreationPromise[userId])!;
    delete inferenceCoordinatesCreationPromise[userId];
    return newInferenceCoordinatesEntry.inferenceAddress;
  }
};

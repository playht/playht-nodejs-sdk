import { PlayRequestConfigWithDefaults } from '../../config/PlayRequestConfig';
import { UserId } from '../../types';
import { debugError, debugWarn } from '../../debug/debugLog';
import {
  InferenceCoordinatesEntry,
  InternalAuthBasedEngine,
  V3InternalSettingsWithDefaults,
} from './V3InternalSettings';
import { resolveV3Settings } from './resolveV3Settings';

const inferenceCoordinatesCreationPromiseStores: Record<`${UserId}:${InternalAuthBasedEngine}`, Promise<InferenceCoordinatesEntry>> = {};

const inferenceCoordinatesStores: Record<InternalAuthBasedEngine, Record<UserId, InferenceCoordinatesEntry>> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogHindi: {},
  PlayDialogLora: {},
  PlayDialogMultilingual: {},
};
type UserAndEngine = {
  userId: UserId;
  engine: InternalAuthBasedEngine;
};
const inferenceCoordinatesInFlightGenerations: Record<`${UserId}:${InternalAuthBasedEngine}`, AbortController> = {};
const inferenceCoordinatesRefreshTimers: Record<`${UserId}:${InternalAuthBasedEngine}`, NodeJS.Timeout> = {};

export const clearInferenceCoordinatesStoreForUser = (userId: UserId): void => {
  for (const engine of Object.keys(inferenceCoordinatesStores) as Array<InternalAuthBasedEngine>) {
    delete inferenceCoordinatesCreationPromiseStores[`${userId}:${engine}`];
    delete inferenceCoordinatesStores[engine][userId];

    clearTimeout(inferenceCoordinatesRefreshTimers[`${userId}:${engine}`]);
    delete inferenceCoordinatesRefreshTimers[`${userId}:${engine}`];

    abortInFlightGeneration(`${userId}:${engine}`);
  }
};

// visible for tests
export function __clearInferenceCoordinatesStoreForAllUsers() {
  for (const engine in inferenceCoordinatesStores) {
    for (const user in inferenceCoordinatesStores[engine as InternalAuthBasedEngine]) {
      clearInferenceCoordinatesStoreForUser(user as UserId);
    }
  }
}

// visible for tests
export const _inspectInferenceCoordinatesStoreForUser = (userId: UserId) => {
  const result: Record<InternalAuthBasedEngine, InferenceCoordinatesEntry | null> = {} as any;
  for (const engine in inferenceCoordinatesStores) {
    const typedEngine = engine as keyof typeof inferenceCoordinatesStores;
    const value = inferenceCoordinatesStores[typedEngine][userId];
    if (value) result[typedEngine] = value;
  }
  return result;
};

function abortInFlightGeneration(userAndEngine: `${UserId}:${InternalAuthBasedEngine}`) {
  const previousGeneration = inferenceCoordinatesInFlightGenerations[userAndEngine];
  if (previousGeneration) {
    previousGeneration.abort('abortInFlightGeneration');
    delete inferenceCoordinatesInFlightGenerations[userAndEngine];
  }
}

const createInferenceCoordinates = async (
  voiceEngine: InternalAuthBasedEngine,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  attemptNo = 1,
): Promise<InferenceCoordinatesEntry> => {
  const userId = reqConfigSettings.userId as UserId;
  const apiKey = reqConfigSettings.apiKey;

  try {
    abortInFlightGeneration(`${userId}:${voiceEngine}`);
    const currentGenerationController = new AbortController();
    inferenceCoordinatesInFlightGenerations[`${userId}:${voiceEngine}`] = currentGenerationController;
    const newInferenceCoordinatesEntry = await v3Settings.customInferenceCoordinatesGenerator(
      voiceEngine,
      userId,
      apiKey,
    );
    // if generation was canceled, doesn't update cache or schedule refresh
    if (currentGenerationController.signal.aborted) return newInferenceCoordinatesEntry;

    if (v3Settings.coordinatesAheadOfTimeAutoRefresh) {
      scheduleAutoRefresh(v3Settings, voiceEngine, userId, reqConfigSettings, newInferenceCoordinatesEntry);
    }

    inferenceCoordinatesStores[voiceEngine][userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (error) {
    if (attemptNo >= v3Settings.coordinatesGetApiCallMaxRetries) throw error;

    logFailedObtainingCredentials(voiceEngine, v3Settings, reqConfigSettings, error, userId, attemptNo);
    return new Promise((resolve) => {
      clearTimeout(inferenceCoordinatesRefreshTimers[`${userId}:${voiceEngine}`]);
      inferenceCoordinatesRefreshTimers[`${userId}:${voiceEngine}`] = setTimeout(() => {
        resolve(createInferenceCoordinates(voiceEngine, v3Settings, reqConfigSettings, attemptNo + 1));
      }, v3Settings.customRetryDelay(attemptNo)).unref();
    });
  }
};

function scheduleAutoRefresh(
  v3Settings: V3InternalSettingsWithDefaults,
  voiceEngine: InternalAuthBasedEngine,
  userId: UserId,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  newInferenceCoordinatesEntry: InferenceCoordinatesEntry,
) {
  clearTimeout(inferenceCoordinatesRefreshTimers[`${userId}:${voiceEngine}`]);
  inferenceCoordinatesRefreshTimers[`${userId}:${voiceEngine}`] = setTimeout(
    () => {
      // notice in this case no one is waiting for the promise to resolve, so we catch eventual errors
      // since if we just let the error bubble up it will be unhandled.
      createInferenceCoordinates(voiceEngine, v3Settings, reqConfigSettings).catch((error) =>
        logGivenUpRefreshingCredentials(voiceEngine, v3Settings, reqConfigSettings, error, userId),
      );
    },
    calculateRefreshDelay(v3Settings, newInferenceCoordinatesEntry.expiresAtMs),
  ).unref();
}

function calculateRefreshDelay(
  v3Settings: V3InternalSettingsWithDefaults,
  newInferenceCoordinatesEntryExpirationTimeMs: number,
) {
  return Math.max(
    v3Settings.coordinatesExpirationMinimalFrequencyMs,
    newInferenceCoordinatesEntryExpirationTimeMs - Date.now() - v3Settings.coordinatesExpirationAdvanceRefreshTimeMs,
  );
}

export const createOrGetInferenceAddress = async (
  voiceEngine: InternalAuthBasedEngine,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
): Promise<string> => {
  const userId = reqConfigSettings.userId as UserId;
  const inferenceCoordinatesEntry = inferenceCoordinatesStores[voiceEngine][userId];

  const v3Settings = resolveV3Settings(reqConfigSettings.experimental?.v3);

  const entryExistsAndIsNotExpired =
    inferenceCoordinatesEntry &&
    inferenceCoordinatesEntry.expiresAtMs >= Date.now() - v3Settings.coordinatesUsableThresholdTimeMs;

  if (entryExistsAndIsNotExpired) return inferenceCoordinatesEntry.inferenceAddress;

  if (inferenceCoordinatesEntry) delete inferenceCoordinatesStores[voiceEngine][userId]; // clear expired entry

  // we don't have a previous in-flight to piggyback on, so we have to dispatch a new one
  if (!(`${userId}:${voiceEngine}` in inferenceCoordinatesCreationPromiseStores)) {
    inferenceCoordinatesCreationPromiseStores[`${userId}:${voiceEngine}`] = createInferenceCoordinates(
      voiceEngine,
      v3Settings,
      reqConfigSettings,
    );
  }

  try {
    const newInferenceCoordinatesEntry = (await inferenceCoordinatesCreationPromiseStores[`${userId}:${voiceEngine}`])!;
    return newInferenceCoordinatesEntry.inferenceAddress;
  } finally {
    delete inferenceCoordinatesCreationPromiseStores[`${userId}:${voiceEngine}`];
  }
};

function logFailedObtainingCredentials(
  voiceEngine: InternalAuthBasedEngine,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  error: unknown,
  userId: UserId,
  attemptNo: number,
) {
  debugWarn(
    reqConfigSettings,
    `Error while trying to get credentials for ${voiceEngine} (attempt ${attemptNo} of ${v3Settings.coordinatesGetApiCallMaxRetries})`,
    {
      event: 'failed-obtaining-credentials',
      error,
      userId,
      voiceEngine,
      attemptNo,
      maxRetries: v3Settings.coordinatesGetApiCallMaxRetries,
    },
  );
}

function logGivenUpRefreshingCredentials(
  voiceEngine: InternalAuthBasedEngine,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  error: unknown,
  userId: UserId,
) {
  debugError(
    reqConfigSettings,
    `Giving up after failing to refresh credentials for ${voiceEngine} after ${v3Settings.coordinatesGetApiCallMaxRetries} attempts`,
    {
      event: 'given-up-obtaining-credentials',
      error,
      userId,
      voiceEngine,
      maxRetries: v3Settings.coordinatesGetApiCallMaxRetries,
    },
  );
}

import { PlayRequestConfigWithDefaults } from '../../config/PlayRequestConfig';
import { UserId } from '../../types';
import { debugError, debugWarn } from '../../debug/debugLog';
import {
  InferenceCoordinatesEntry,
  InternalAuthBasedEngine,
  V3InternalSettingsWithDefaults,
} from './V3InternalSettings';
import { resolveV3Settings } from './resolveV3Settings';

type UserAndEngine = `${UserId}:${InternalAuthBasedEngine}`;

const inferenceCoordinatesStores: Record<UserAndEngine, InferenceCoordinatesEntry> = {};
const inferenceCoordinatesCreationPromiseStores: Record<UserAndEngine, Promise<InferenceCoordinatesEntry>> = {};
const inferenceCoordinatesInFlightGenerations: Record<UserAndEngine, AbortController> = {};
const inferenceCoordinatesRefreshTimers: Record<UserAndEngine, NodeJS.Timeout> = {};

export const clearInferenceCoordinatesStoreForUser = (userToClear: UserId): void => {
  for (const [userAndEngine] of Object.entries(inferenceCoordinatesStores) as Array<
    [UserAndEngine, InferenceCoordinatesEntry]
  >) {
    const [userId] = userAndEngine.split(':') as [UserId];
    if (userId !== userToClear) continue;
    delete inferenceCoordinatesCreationPromiseStores[userAndEngine];
    delete inferenceCoordinatesStores[userAndEngine];

    clearTimeout(inferenceCoordinatesRefreshTimers[userAndEngine]);
    delete inferenceCoordinatesRefreshTimers[userAndEngine];

    abortInFlightGeneration(userAndEngine);
  }
};

// visible for tests
export function __clearInferenceCoordinatesStoreForAllUsers() {
  for (const icse of Object.entries(inferenceCoordinatesStores) as Array<[UserAndEngine, InferenceCoordinatesEntry]>) {
    const userId = icse[0].split(':')[0] as UserId;
    clearInferenceCoordinatesStoreForUser(userId);
  }
}

// visible for tests
export const _inspectInferenceCoordinatesStoreForUser = (selectedUserId: UserId) => {
  const result: Record<InternalAuthBasedEngine, InferenceCoordinatesEntry | null> = {} as any;
  for (const icse of Object.entries(inferenceCoordinatesStores) as Array<[UserAndEngine, InferenceCoordinatesEntry]>) {
    const [userId, typedEngine] = icse[0].split(':') as [UserId, InternalAuthBasedEngine];
    if (userId == selectedUserId) result[typedEngine] = icse[1];
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

  const userAndEngine = `${userId}:${voiceEngine}` as const;
  try {
    abortInFlightGeneration(userAndEngine);
    const currentGenerationController = new AbortController();
    inferenceCoordinatesInFlightGenerations[userAndEngine] = currentGenerationController;
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

    inferenceCoordinatesStores[userAndEngine] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (error) {
    if (attemptNo >= v3Settings.coordinatesGetApiCallMaxRetries) throw error;

    logFailedObtainingCredentials(voiceEngine, v3Settings, reqConfigSettings, error, userId, attemptNo);
    return new Promise((resolve) => {
      clearTimeout(inferenceCoordinatesRefreshTimers[userAndEngine]);
      inferenceCoordinatesRefreshTimers[userAndEngine] = setTimeout(() => {
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
  const inferenceCoordinatesEntry = inferenceCoordinatesStores[`${userId}:${voiceEngine}`];

  const v3Settings = resolveV3Settings(reqConfigSettings.experimental?.v3);

  const entryExistsAndIsNotExpired =
    inferenceCoordinatesEntry &&
    inferenceCoordinatesEntry.expiresAtMs >= Date.now() - v3Settings.coordinatesUsableThresholdTimeMs;

  if (entryExistsAndIsNotExpired) return inferenceCoordinatesEntry.inferenceAddress;

  if (inferenceCoordinatesEntry) delete inferenceCoordinatesStores[`${userId}:${voiceEngine}`]; // clear expired entry

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

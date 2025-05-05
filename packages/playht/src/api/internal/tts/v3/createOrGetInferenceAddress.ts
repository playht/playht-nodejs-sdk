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

const cachedCoordinates: Record<UserAndEngine, InferenceCoordinatesEntry> = {};
const coordinatesCreationPromises: Record<UserAndEngine, Promise<InferenceCoordinatesEntry>> = {};
const inFlightRefreshControllers: Record<UserAndEngine, AbortController> = {};
const delayedRefreshTimers: Record<UserAndEngine, NodeJS.Timeout> = {};

export async function createOrGetInferenceAddress(
  voiceEngine: InternalAuthBasedEngine,
  reqConfig: PlayRequestConfigWithDefaults['settings'],
): Promise<string> {
  const v3Settings = resolveV3Settings(reqConfig.experimental?.v3);

  const userAndEngine = `${reqConfig.userId as UserId}:${voiceEngine}` as const;

  const cachedCoordinatesEntry = cachedCoordinates[userAndEngine];
  const entryExistsAndIsNotExpired =
    cachedCoordinatesEntry &&
    cachedCoordinatesEntry.expiresAtMs >= Date.now() - v3Settings.coordinatesUsableThresholdTimeMs;

  if (entryExistsAndIsNotExpired) return cachedCoordinatesEntry.inferenceAddress;

  if (cachedCoordinatesEntry) delete cachedCoordinates[userAndEngine]; // clear expired entry

  if (!coordinatesCreationPromises[userAndEngine]) {
    // we don't have a previous in-flight to piggyback on, so we have to dispatch a new one
    coordinatesCreationPromises[userAndEngine] = createInferenceCoordinates(voiceEngine, v3Settings, reqConfig);
  }

  try {
    const newCoordinates = (await coordinatesCreationPromises[userAndEngine])!;
    return newCoordinates.inferenceAddress;
  } finally {
    delete coordinatesCreationPromises[userAndEngine];
  }
}

async function createInferenceCoordinates(
  voiceEngine: InternalAuthBasedEngine,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  attemptNo = 1,
): Promise<InferenceCoordinatesEntry> {
  const userId = reqConfigSettings.userId as UserId;
  const apiKey = reqConfigSettings.apiKey;

  const userAndEngine = `${userId}:${voiceEngine}` as const;
  try {
    // we abort previous generations, to make sure their results are not stored in the cache
    abortInFlightGeneration(userAndEngine);
    const currentGenerationController = new AbortController();
    inFlightRefreshControllers[userAndEngine] = currentGenerationController;
    const newInferenceCoordinatesEntry = await v3Settings.customInferenceCoordinatesGenerator(
      voiceEngine,
      userId,
      apiKey,
    );
    // if generation was canceled, don't update cache or schedule refresh
    if (currentGenerationController.signal.aborted) return newInferenceCoordinatesEntry;

    if (v3Settings.coordinatesAheadOfTimeAutoRefresh) {
      scheduleAutoRefresh(voiceEngine, userId, v3Settings, reqConfigSettings, newInferenceCoordinatesEntry);
    }

    cachedCoordinates[userAndEngine] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (error) {
    if (attemptNo >= v3Settings.coordinatesGetApiCallMaxRetries) throw error;

    logFailedObtainingCredentials(voiceEngine, userId, v3Settings, reqConfigSettings, error, attemptNo);
    return new Promise((resolve) => {
      clearTimeout(delayedRefreshTimers[userAndEngine]);
      delayedRefreshTimers[userAndEngine] = setTimeout(() => {
        resolve(createInferenceCoordinates(voiceEngine, v3Settings, reqConfigSettings, attemptNo + 1));
      }, v3Settings.customRetryDelay(attemptNo)).unref();
    });
  }
}

function abortInFlightGeneration(userAndEngine: `${UserId}:${InternalAuthBasedEngine}`) {
  inFlightRefreshControllers[userAndEngine]?.abort('abortInFlightGeneration');
  delete inFlightRefreshControllers[userAndEngine];
}

function scheduleAutoRefresh(
  voiceEngine: InternalAuthBasedEngine,
  userId: UserId,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  newInferenceCoordinatesEntry: InferenceCoordinatesEntry,
) {
  clearTimeout(delayedRefreshTimers[`${userId}:${voiceEngine}`]);
  delayedRefreshTimers[`${userId}:${voiceEngine}`] = setTimeout(
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

function logFailedObtainingCredentials(
  voiceEngine: InternalAuthBasedEngine,
  userId: UserId,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  error: unknown,
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

export function clearInferenceCoordinatesStoreForUser(userToClear: UserId): void {
  for (const [userAndEngine] of Object.entries(cachedCoordinates) as Array<
    [UserAndEngine, InferenceCoordinatesEntry]
  >) {
    const [userId] = userAndEngine.split(':') as [UserId];
    if (userId !== userToClear) continue;
    delete coordinatesCreationPromises[userAndEngine];
    delete cachedCoordinates[userAndEngine];

    clearTimeout(delayedRefreshTimers[userAndEngine]);
    delete delayedRefreshTimers[userAndEngine];

    abortInFlightGeneration(userAndEngine);
  }
}

// visible for tests
export function __inspectInferenceCoordinatesStoreForUser(selectedUserId: UserId) {
  const result: Record<InternalAuthBasedEngine, InferenceCoordinatesEntry | null> = {} as any;
  for (const icse of Object.entries(cachedCoordinates) as Array<[UserAndEngine, InferenceCoordinatesEntry]>) {
    const [userId, typedEngine] = icse[0].split(':') as [UserId, InternalAuthBasedEngine];
    if (userId == selectedUserId) result[typedEngine] = icse[1];
  }
  return result;
}

// visible for tests
export function __clearInferenceCoordinatesStoreForAllUsers() {
  for (const icse of Object.entries(cachedCoordinates) as Array<[UserAndEngine, InferenceCoordinatesEntry]>) {
    const userId = icse[0].split(':')[0] as UserId;
    clearInferenceCoordinatesStoreForUser(userId);
  }
}

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

type CachedCoordinatesValue = {
  coordinates: InferenceCoordinatesEntry;
  lastUsedAt: Date;
  autoCleanupIfUnused: boolean;
};
const cachedCoordinates: Record<UserAndEngine, CachedCoordinatesValue> = {};
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
    cachedCoordinatesEntry.coordinates.expiresAtMs >= Date.now() - v3Settings.coordinatesUsableThresholdTimeMs;

  if (entryExistsAndIsNotExpired) {
    cachedCoordinatesEntry.lastUsedAt = new Date(); // Update last used time
    return cachedCoordinatesEntry.coordinates.inferenceAddress;
  }

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

    cachedCoordinates[userAndEngine] = {
      coordinates: newInferenceCoordinatesEntry,
      lastUsedAt: new Date(),
      autoCleanupIfUnused: v3Settings.autoCleanupUnusedCoordinates,
    };

    if (v3Settings.autoCleanupUnusedCoordinates) {
      ensureAutoCleanupUnusedCoordinatesWorkerIsRunning();
    }

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

function forEachCachedCoordinate(
  callback: (opts: {
    userId: UserId;
    voiceEngine: InternalAuthBasedEngine;
    userAndEngine: UserAndEngine;
    coordinates: CachedCoordinatesValue;
  }) => void,
): void {
  for (const [userAndEngine, coordinates] of Object.entries(cachedCoordinates) as Array<
    [UserAndEngine, CachedCoordinatesValue]
  >) {
    const [userId, voiceEngine] = userAndEngine.split(':') as [UserId, InternalAuthBasedEngine];
    callback({ userId, voiceEngine, userAndEngine, coordinates });
  }
}

export function clearInferenceCoordinatesStoreForUser(userToClear: UserId): void {
  forEachCachedCoordinate(({ userId, userAndEngine }) => {
    if (userId === userToClear) clearInferenceCoordinatesStoreForUserAndEngine(userAndEngine);
  });
}

function clearInferenceCoordinatesStoreForUserAndEngine(userAndEngine: UserAndEngine) {
  delete coordinatesCreationPromises[userAndEngine];
  delete cachedCoordinates[userAndEngine];

  clearTimeout(delayedRefreshTimers[userAndEngine]);
  delete delayedRefreshTimers[userAndEngine];

  abortInFlightGeneration(userAndEngine);
}

// constants are visible for tests
export const AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours
export const AUTO_CLEANUP_WORKER_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
let cleanupIntervalTimer: NodeJS.Timeout | null = null;
function ensureAutoCleanupUnusedCoordinatesWorkerIsRunning() {
  if (cleanupIntervalTimer) return;

  cleanupIntervalTimer = setInterval(() => {
    const now = Date.now();
    forEachCachedCoordinate(({ userAndEngine, coordinates }) => {
      if (!coordinates.autoCleanupIfUnused) return;

      const unusedTimeLimit = coordinates.lastUsedAt.getTime() + AUTO_CLEANUP_UNUSED_COORDINATES_AFTER_MS;
      if (now > unusedTimeLimit) {
        clearInferenceCoordinatesStoreForUserAndEngine(userAndEngine);
      }
    });
  }, AUTO_CLEANUP_WORKER_INTERVAL_MS).unref();
}

// visible for tests
export function __inspectInferenceCoordinatesStoreForUser(selectedUserId: UserId) {
  const result: Record<InternalAuthBasedEngine, CachedCoordinatesValue> = {} as any;
  forEachCachedCoordinate(({ userId, voiceEngine, coordinates }) => {
    if (userId == selectedUserId) result[voiceEngine] = coordinates;
  });
  return result;
}

// visible for tests
export function __clearInferenceCoordinatesStoreForAllUsers() {
  forEachCachedCoordinate(({ userId }) => {
    clearInferenceCoordinatesStoreForUser(userId);
  });
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
    cleanupIntervalTimer = null;
  }
}

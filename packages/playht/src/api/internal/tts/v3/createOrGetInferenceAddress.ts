import crypto from 'crypto';
import { PlayRequestConfigWithDefaults } from '../../config/PlayRequestConfig';
import { UserId } from '../../types';
import { debugError, debugWarn } from '../../debug/debugLog';
import {
  InferenceCoordinatesEntry,
  InternalAuthBasedEngine,
  V3InternalSettingsWithDefaults,
} from './V3InternalSettings';
import { resolveV3Settings } from './resolveV3Settings';

const inferenceCoordinatesCreationPromiseStores: Record<
  InternalAuthBasedEngine,
  Record<UserId, Promise<InferenceCoordinatesEntry>>
> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogHindi: {},
  PlayDialogLora: {},
  PlayDialogMultilingual: {},
};
const inferenceCoordinatesStores: Record<InternalAuthBasedEngine, Record<UserId, InferenceCoordinatesEntry>> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogHindi: {},
  PlayDialogLora: {},
  PlayDialogMultilingual: {},
};
const inferenceCoordinatesInFlightGenerations: Record<InternalAuthBasedEngine, Record<UserId, AbortController>> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogHindi: {},
  PlayDialogLora: {},
  PlayDialogMultilingual: {},
};
const inferenceCoordinatesRefreshTimers: Record<InternalAuthBasedEngine, Record<UserId, NodeJS.Timeout>> = {
  'Play3.0-mini': {},
  PlayDialog: {},
  PlayDialogArabic: {},
  PlayDialogHindi: {},
  PlayDialogLora: {},
  PlayDialogMultilingual: {},
};

export const clearInferenceCoordinatesStoreForUser = (userId: UserId): void => {
  for (const engine in inferenceCoordinatesStores) {
    delete inferenceCoordinatesCreationPromiseStores[engine as keyof typeof inferenceCoordinatesCreationPromiseStores][
      userId
    ];
    delete inferenceCoordinatesStores[engine as keyof typeof inferenceCoordinatesStores][userId];
    clearTimeout(inferenceCoordinatesRefreshTimers[engine as keyof typeof inferenceCoordinatesRefreshTimers][userId]);
    delete inferenceCoordinatesRefreshTimers[engine as keyof typeof inferenceCoordinatesRefreshTimers][userId];
    abortOngoingGeneration(engine as InternalAuthBasedEngine, userId);
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

function abortOngoingGeneration(voiceEngine: InternalAuthBasedEngine, userId: UserId) {
  const previousGeneration = inferenceCoordinatesInFlightGenerations[voiceEngine][userId];
  if (previousGeneration) {
    previousGeneration.abort('abortOngoingGeneration');
    delete inferenceCoordinatesInFlightGenerations[voiceEngine][userId];
  }
}

const createInferenceCoordinates = async (
  voiceEngine: InternalAuthBasedEngine,
  v3Settings: V3InternalSettingsWithDefaults,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
  attemptNo = 1,
): Promise<InferenceCoordinatesEntry> => {
  const execution = crypto.randomUUID();
  const userId = reqConfigSettings.userId as UserId;
  console.log(`createInferenceCoordinates CALLED for ${userId} -- ${execution}`);
  const apiKey = reqConfigSettings.apiKey;

  try {
    abortOngoingGeneration(voiceEngine, userId);
    const currentGenerationController = new AbortController();
    inferenceCoordinatesInFlightGenerations[voiceEngine][userId] = currentGenerationController;
    const newInferenceCoordinatesEntry = await v3Settings.customInferenceCoordinatesGenerator(
      voiceEngine,
      userId,
      apiKey,
    );
    // if generation was canceled, doesn't update cache or schedule refresh
    if (currentGenerationController.signal.aborted) return newInferenceCoordinatesEntry;

    // schedule the next refresh, if configured to do so
    if (v3Settings.coordinatesAheadOfTimeAutoRefresh) {
      const prevTimerId = inferenceCoordinatesRefreshTimers[voiceEngine][userId];
      console.log(execution, 'clearing timer, loc: 222, id: ', +(prevTimerId ?? -1), ' user:', userId);
      clearTimeout(prevTimerId);
      const timerId = setTimeout(
        () => {
          console.log(execution, 'timer triggered, loc: 111, id: ', +timerId, ' user:', userId);
          // notice in this case no one is waiting for the promise to resolve, so we catch eventual errors
          // since if we just let the error bubble up it will be unhandled.
          createInferenceCoordinates(voiceEngine, v3Settings, reqConfigSettings).catch((error) =>
            logGivenUpRefreshingCredentials(voiceEngine, v3Settings, reqConfigSettings, error, userId),
          );
        },
        calculateRefreshDelay(v3Settings, newInferenceCoordinatesEntry.expiresAtMs),
      ).unref();
      inferenceCoordinatesRefreshTimers[voiceEngine][userId] = timerId;
      console.log(execution, 'timer started, loc: 111, id: ', +timerId, ' user:', userId);
    }

    inferenceCoordinatesStores[voiceEngine][userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (error) {
    if (attemptNo >= v3Settings.coordinatesGetApiCallMaxRetries) throw error;

    logFailedObtainingCredentials(voiceEngine, v3Settings, reqConfigSettings, error, userId, attemptNo);
    return new Promise((resolve) => {
      const prevTimerId = inferenceCoordinatesRefreshTimers[voiceEngine][userId];
      console.log(execution, 'clearing timer, loc: 222, id: ', +(prevTimerId ?? 0), ' user:', userId);
      clearTimeout(prevTimerId);
      const timerId = setTimeout(() => {
        console.log(execution, 'timer triggered, loc: 222, id: ', +timerId, ' user:', userId);
        resolve(createInferenceCoordinates(voiceEngine, v3Settings, reqConfigSettings, attemptNo + 1));
      }, v3Settings.customRetryDelay(attemptNo)).unref();
      inferenceCoordinatesRefreshTimers[voiceEngine][userId] = timerId;
      console.log(execution, 'timer started, loc: 222, id: ', +timerId, ' user:', userId);
    });
  }
};

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

  // we already have a previous request in-flight, piggyback on it
  if (!(userId in inferenceCoordinatesCreationPromiseStores[voiceEngine])) {
    console.log('call not via timer for user', userId);
    inferenceCoordinatesCreationPromiseStores[voiceEngine][userId] = createInferenceCoordinates(
      voiceEngine,
      v3Settings,
      reqConfigSettings,
    );
  }

  try {
    const newInferenceCoordinatesEntry = (await inferenceCoordinatesCreationPromiseStores[voiceEngine][userId])!;
    return newInferenceCoordinatesEntry.inferenceAddress;
  } finally {
    delete inferenceCoordinatesCreationPromiseStores[voiceEngine][userId];
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

import axios from 'axios';
import { convertError } from '../convertError';
import { PlayHTSdkOverrides } from '../PlayHTSdkOverrides';
import { APISettingsStore } from '../../APISettingsStore';
import { keepAliveHttpsAgent } from '../http';
import { InferenceCoordinatesEntry } from './v3Overrides';

const inferenceCoordinatesStore: Record<string, InferenceCoordinatesEntry> = {};

const createInferenceCoordinatesApiCall = async (
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
          expires_at: number;
        },
    )
    .catch((error: any) => convertError(error));
  return {
    inferenceAddress: data.inference_address,
    expiresAtMs: data.expires_at * 1000, // API sends it as seconds, so we need to convert it to milliseconds here
  };
};

PlayHTSdkOverrides.v3.inferenceCoordinatesGenerator = createInferenceCoordinatesApiCall;

async function createInferenceCoordinates(
  userId: string,
  apiKey: string,
  attemptNo = 0,
): Promise<InferenceCoordinatesEntry> {
  try {
    const newInferenceCoordinatesEntry = await PlayHTSdkOverrides.v3.inferenceCoordinatesGenerator(userId, apiKey);
    const automaticRefreshDelay = Math.max(
      PlayHTSdkOverrides.v3.COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS,
      newInferenceCoordinatesEntry.expiresAtMs -
        Date.now() -
        PlayHTSdkOverrides.v3.COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS,
    );
    setTimeout(() => createInferenceCoordinates(userId, apiKey), automaticRefreshDelay).unref();
    inferenceCoordinatesStore[userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (e) {
    if (attemptNo >= PlayHTSdkOverrides.v3.COORDINATES_GET_API_CALL_MAX_RETRIES) {
      throw e;
    }
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(createInferenceCoordinates(userId, apiKey, attemptNo + 1));
        },
        500 * (attemptNo + 1),
      ).unref();
    });
  }
}

export async function createOrGetInferenceAddress(): Promise<string> {
  const { userId, apiKey } = APISettingsStore.getSettings();
  const inferenceCoordinatesEntry = inferenceCoordinatesStore[userId];
  if (inferenceCoordinatesEntry && inferenceCoordinatesEntry.expiresAtMs >= Date.now() - 5_000) {
    return inferenceCoordinatesEntry.inferenceAddress;
  } else {
    const newInferenceCoordinatesEntry = await createInferenceCoordinates(userId, apiKey);
    return newInferenceCoordinatesEntry.inferenceAddress;
  }
}

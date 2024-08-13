import type { V2ApiOptions } from '../apiCommon';
import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import { APISettingsStore } from '../APISettingsStore';
import { PlayHT30OutputStreamFormat } from '../../PlayHT30';
import { convertError } from './convertError';

const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
});

const COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS = 60_000; // refresh no more frequently than 1 minute
const COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS = 300_000; // 5 minutes
const COORDINATES_GET_API_CALL_MAX_RETRIES = 3; // number of attempts to get the coordinates

type InferenceCoordinatesEntry = {
  inferenceAddress: string;
  expiresAtMs: number;
};

const inferenceCoordinatesStore: Record<string, InferenceCoordinatesEntry> = {};

const createInferenceCoordinatesApiCall = async (): Promise<InferenceCoordinatesEntry> => {
  const { userId, apiKey } = APISettingsStore.getSettings();
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

async function createInferenceCoordinates(userId: string, attemptNo = 0): Promise<InferenceCoordinatesEntry> {
  try {
    const newInferenceCoordinatesEntry = await createInferenceCoordinatesApiCall();
    const automaticRefreshDelay = Math.max(
      COORDINATES_EXPIRATION_MINIMAL_FREQUENCY_MS,
      newInferenceCoordinatesEntry.expiresAtMs - Date.now() - COORDINATES_EXPIRATION_ADVANCE_REFRESH_TIME_MS,
    );
    setTimeout(() => createInferenceCoordinates(userId), automaticRefreshDelay).unref();
    inferenceCoordinatesStore[userId] = newInferenceCoordinatesEntry;
    return newInferenceCoordinatesEntry;
  } catch (e) {
    if (attemptNo >= COORDINATES_GET_API_CALL_MAX_RETRIES) {
      throw e;
    }
    return new Promise((resolve) => {
      setTimeout(
        () => {
          resolve(createInferenceCoordinates(userId, attemptNo + 1));
        },
        500 * (attemptNo + 1),
      ).unref();
    });
  }
}

async function createOrGetInferenceAddress(): Promise<string> {
  const { userId } = APISettingsStore.getSettings();
  const inferenceCoordinatesEntry = inferenceCoordinatesStore[userId];
  if (inferenceCoordinatesEntry && inferenceCoordinatesEntry.expiresAtMs >= Date.now() - 5_000) {
    return inferenceCoordinatesEntry.inferenceAddress;
  } else {
    const newInferenceCoordinatesEntry = await createInferenceCoordinates(userId);
    return newInferenceCoordinatesEntry.inferenceAddress;
  }
}

export async function generateV3Stream(
  text: string,
  voice: string,
  options?: V2ApiOptions,
): Promise<NodeJS.ReadableStream> {
  if (options?.outputFormat === 'raw') {
    throw new Error('Raw output format is not supported in PlayHT3.0');
  }
  const inferenceAddress = await createOrGetInferenceAddress();
  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: inferenceAddress,
    headers: {
      accept: outputFormatToMimeType(options?.outputFormat),
      'content-type': 'application/json',
    },
    responseType: 'stream',
    data: {
      text,
      voice,
      quality: options?.quality,
      output_format: options?.outputFormat,
      speed: options?.speed || 1,
      sample_rate: options?.sampleRate || 24000,
      seed: options?.seed,
      temperature: options?.temperature,
      voice_engine: options?.voiceEngine,
      emotion: options?.emotion,
      voice_guidance: options?.voiceGuidance,
      text_guidance: options?.textGuidance,
      style_guidance: options?.styleGuidance,
    },
    httpsAgent: keepAliveHttpsAgent,
  };

  const response = await axios(streamOptions).catch((error: any) => convertError(error));
  return response.data;
}

const outputFormatToMimeType = (outputFormat: PlayHT30OutputStreamFormat | undefined): `audio/${string}` => {
  switch (outputFormat) {
    case 'mulaw':
      return 'audio/basic';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    case 'mp3':
      return 'audio/mpeg';
    default:
      return outputFormatToMimeType('mp3');
  }
};

import axios from 'axios';
import APISettingsStore from './APISettingsStore';
import { V1ApiOptions, V1SpeechResult } from './v1Common';

interface GenerationJobResponse {
  status: string;
  transcriptionId: string;
  contentLength: number;
  wordCount: number;
}

const WAIT_BETWEEN_STATUS_CHECKS_MS = 150;
const MAX_STATUS_CHECKS_RETRIES = 10;

export default async function generateV1Speech(
  content: string,
  voice: string,
  options?: V1ApiOptions,
): Promise<V1SpeechResult> {
  const { apiKey, userId } = APISettingsStore.getSettings();
  const convertOptions = {
    method: 'POST',
    url: 'https://play.ht/api/v1/convert',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
    data: {
      content: [content],
      voice,
      narrationStyle: options?.narrationStyle,
      globalSpeed: options?.globalSpeed,
      trimSilence: options?.trimSilence,
      pronunciations: options?.pronunciations,
    },
  };

  const generationJobData = await axios
    .request(convertOptions)
    .then(({ data }: { data: GenerationJobResponse }) => data)
    .catch((error: any) => {
      throw new Error(error);
    });

  const transcriptionId = generationJobData.transcriptionId;

  const statusOptions = {
    method: 'GET',
    url: `https://play.ht/api/v1/articleStatus?transcriptionId=${transcriptionId}`,
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  let retries = 0;
  return await (async function retryUntilGenerated() {
    do {
      const generationStatus = await axios
        .request(statusOptions)
        .then(({ data }: { data: V1SpeechResult }) => {
          return data;
        })
        .catch(function (error) {
          throw new Error(error);
        });
      const { audioUrl, transcriped, converted } = generationStatus;
      if (transcriped || converted) {
        const url = Array.isArray(audioUrl) ? audioUrl[0] : audioUrl;
        return {
          ...generationStatus,
          audioUrl: url,
        };
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, WAIT_BETWEEN_STATUS_CHECKS_MS));
    } while (retries < MAX_STATUS_CHECKS_RETRIES);
    throw new Error('Audio generation error. Max status check retries reached.');
  })();
}

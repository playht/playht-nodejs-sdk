import type { APISettings, v1ApiOptions } from '../index';
import axios from 'axios';

export type V1SpeechResult = {
  preset: string;
  transcriptionId: string;
  audioUrl: Array<string> | string;
  voice: string;
  transcriped?: boolean;
  converted?: boolean;
  message: string;
};

interface GenerationJobResponse {
  status: string;
  transcriptionId: string;
  contentLength: number;
  wordCount: number;
}

const WAIT_BETWEEN_STATUS_CHECKS_MS = 150;
const MAX_STATUS_CHECKS_RETRIES = 10;

export default async function generateV1Speech(
  settings: APISettings,
  content: Array<string>,
  voice: string,
  options?: v1ApiOptions,
): Promise<V1SpeechResult> {
  const { apiKey, userId } = settings;
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
      content,
      voice,
      title: options?.title,
      narrationStyle: options?.narrationStyle,
      globalSpeed: options?.globalSpeed,
      trimSilence: options?.trimSilence,
      pronunciations: options?.pronunciations,
      transcriptionId: options?.transcriptionId,
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
      if (generationStatus.transcriped || generationStatus.converted) {
        return generationStatus;
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, WAIT_BETWEEN_STATUS_CHECKS_MS));
    } while (retries < MAX_STATUS_CHECKS_RETRIES);
    throw new Error('Audio generation error. Max status check retries reached.');
  })();
}

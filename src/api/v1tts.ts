import type { v1ApiOptions } from '../index';
import axios from 'axios';

export type v1SpeechResult = {};

interface GenerationJobResponse {
  status: string;
  transcriptionId: string;
  contentLength: number;
  wordCount: number;
}

export async function generateV1Speech(
  apiKey: string,
  userId: string,
  content: Array<string>,
  voice: string,
  options?: v1ApiOptions,
): Promise<v1SpeechResult> {
  const requestOptions = {
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
    .request(requestOptions)
    .then(({ data }: { data: GenerationJobResponse }) => {
      console.log(data);
      return data;
    })
    .catch((error: any) => {
      console.error(error);
    });

  console.dir(generationJobData);
  return {};
}

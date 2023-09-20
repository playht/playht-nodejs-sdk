import type { AxiosRequestConfig } from 'axios';
import type { V2ApiOptions } from './apiCommon';
import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';

export async function generateV2Stream(
  text: string,
  voice: string,
  options?: V2ApiOptions,
): Promise<NodeJS.ReadableStream> {
  const { apiKey, userId } = APISettingsStore.getSettings();

  const outputFormat = options?.outputFormat || 'mp3';
  const accept = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/basic';

  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://play.ht/api/v2/tts/stream',
    headers: {
      accept,
      'content-type': 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
    responseType: 'stream',
    data: {
      text,
      voice,
      quality: options?.quality || 'medium',
      output_format: outputFormat,
      speed: options?.speed || 1,
      sample_rate: options?.sampleRate || 24000,
      seed: options?.seed,
      temperature: options?.temperature,
    },
  };

  const response = await axios(streamOptions).catch((error: any) => {
    throw new Error(error);
  });

  return response.data;
}

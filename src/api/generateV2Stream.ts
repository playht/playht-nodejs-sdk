import type { AxiosRequestConfig } from 'axios';
import type { V2ApiOptions } from './apiCommon';
import { Writable } from 'node:stream';
import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';

export async function generateV2Stream(
  text: string,
  voice: string,
  outputStream: Writable,
  options?: V2ApiOptions,
): Promise<void> {
  const { apiKey, userId } = APISettingsStore.getSettings();
  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://play.ht/api/v2/tts/stream',
    headers: {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
    responseType: 'stream',
    data: {
      text,
      voice,
      quality: options?.quality || 'medium',
      output_format: options?.outputFormat || 'mp3',
      speed: options?.speed || 1,
      sample_rate: options?.sampleRate || 24000,
      seed: options?.seed,
      temperature: options?.temperature,
    },
  };

  const response = await axios(streamOptions).catch((error: any) => {
    throw new Error(error);
  });

  response.data.pipe(outputStream);
}

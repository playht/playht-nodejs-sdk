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
      voice_engine: options?.voiceEngine,
      emotion: options?.emotion,
      voice_guidance: options?.voiceGuidance,
      style_guidance: options?.styleGuidance,
    },
  };

  const response = await axios(streamOptions).catch((error: any) => {
    if (error?.response?.data?.statusCode && error?.response?.data?.statusMessage) {
      throw `Error ${error.response.data.statusCode}: ${error.response.data.statusMessage}`;
    }
    if (error?.message) {
      throw `Error ${error.message}`;
    }
    throw 'Unknown failure when generating speech';
  });

  return response.data;
}

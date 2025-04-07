import type { AxiosRequestConfig } from 'axios';
import type { V2ApiOptions } from './apiCommon';
import { type PlayDialogTurboEngineStreamOptions, type PlayRequestConfig } from '../index';
import { keepAliveHttpsAgent } from './internal/http';
import { convertError } from './internal/convertError';
import { mapPlayDialogTurboVoice } from './internal/tts/dialog-turbo/PlayDialogTurboVoice';
import { getAxiosClient } from './internal/config/getAxiosClient';

export async function generateV2Stream(
  text: string,
  voice: string,
  options: V2ApiOptions | PlayDialogTurboEngineStreamOptions,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const { apiKey, userId } = reqConfig.settings;

  const outputFormat = options?.outputFormat || 'mp3';
  const accept = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/basic';

  const data = {
    text,
    voice_engine: options?.voiceEngine,
    ...(options?.voiceEngine === 'PlayDialog-turbo'
      ? {
          voice: mapPlayDialogTurboVoice(options?.voiceId),
          language: options?.language,
        }
      : {
          voice,
          quality: options?.quality || 'medium',
          output_format: outputFormat,
          speed: options?.speed || 1,
          sample_rate: options?.sampleRate || 24000,
          seed: options?.seed,
          temperature: options?.temperature,
          emotion: options?.emotion,
          voice_guidance: options?.voiceGuidance,
          text_guidance: options?.textGuidance,
          style_guidance: options?.styleGuidance,
        }),
  };
  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://api.play.ht/api/v2/tts/stream',
    headers: {
      accept,
      'content-type': 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
    data,
    responseType: 'stream',
    httpsAgent: keepAliveHttpsAgent,
    signal: reqConfig.signal,
  };

  const response = await getAxiosClient(reqConfig.settings)(streamOptions).catch((error: any) => convertError(error));
  return response.data;
}

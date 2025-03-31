import type { AxiosRequestConfig } from 'axios';
import type { V2ApiOptions } from './apiCommon';
import axios from 'axios';
import { type PlayDialogTurboEngineStreamOptions } from '../index';
import { APISettingsStore } from './APISettingsStore';
import { keepAliveHttpsAgent } from './internal/http';
import { convertError } from './internal/convertError';
import { mapPlayDialogTurboVoice } from './internal/tts/dialog-turbo/PlayDialogTurboVoice';

export async function generateV2Stream(
  text: string,
  voice: string,
  options?: V2ApiOptions | PlayDialogTurboEngineStreamOptions,
): Promise<NodeJS.ReadableStream> {
  const { apiKey, userId } = APISettingsStore.getSettings();

  const outputFormat = options?.outputFormat || 'mp3';
  const accept = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/basic';

  console.log('USING V2 API');
  const data = {
    text,
    voice_engine: options?.voiceEngine,
    ...(options?.voiceEngine === 'PlayDialog-turbo'
      ? {
          voice: mapPlayDialogTurboVoice(options?.voiceId),
          language: options?.language || 'english',
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
  };

  const response = await axios(streamOptions).catch((error: any) => convertError(error));

  return response.data;
}

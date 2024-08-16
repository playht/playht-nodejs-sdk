import type { V2ApiOptions } from '../../apiCommon';
import axios, { AxiosRequestConfig } from 'axios';
import { PlayHT30OutputStreamFormat } from '../../../PlayHT30';
import { convertError } from '../convertError';
import { keepAliveHttpsAgent } from '../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

export async function generateV3Stream(
  text: string,
  voice: string,
  options: V2ApiOptions,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  if (options?.outputFormat === 'raw') {
    throw new Error('Raw output format is not supported in Play3.0');
  }
  const inferenceAddress = await createOrGetInferenceAddress(reqConfig);
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

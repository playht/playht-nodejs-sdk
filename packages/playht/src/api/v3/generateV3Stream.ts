import type { V3ApiOptions } from '../apiCommon';
import type { Play30OutputStreamFormat } from '../../index';
import axios, { AxiosRequestConfig } from 'axios';
import { convertError } from '../internal/convertError';
import { keepAliveHttpsAgent } from '../internal/http';
import { PlayRequestConfig } from '../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

export async function generateV3Stream(
  text: string,
  voice: string,
  options: V3ApiOptions,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const inferenceAddress = await createOrGetInferenceAddress(reqConfig.settings);
  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: inferenceAddress,
    headers: {
      accept: outputFormatToMimeType(options.outputFormat),
    },
    data: {
      text,
      voice,
      quality: options.quality,
      output_format: options.outputFormat,
      speed: options.speed,
      sample_rate: options.sampleRate,
      seed: options.seed,
      temperature: options.temperature,
      voice_engine: options.voiceEngine,
      emotion: options.emotion,
      voice_guidance: options.voiceGuidance,
      text_guidance: options.textGuidance,
      style_guidance: options.styleGuidance,
      language: options.language,
      version: 'v3',
    },
    responseType: 'stream',
    httpsAgent: keepAliveHttpsAgent,
    signal: reqConfig.signal,
  };

  const response = await axios(streamOptions).catch((error: any) => convertError(error));
  return response.data;
}

const outputFormatToMimeType = (outputFormat: Play30OutputStreamFormat | undefined): `audio/${string}` => {
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

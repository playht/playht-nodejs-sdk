import type { AuthBasedApiOptions, V2ApiOptions } from '../../../apiCommon';
import type { Play30EngineStreamOptions, PlayDialogEngineStreamOptions } from '../../../../index';
import axios, { AxiosRequestConfig } from 'axios';
import { convertError } from '../../convertError';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

export async function generateAuthBasedStream(
  text: string,
  voice: string,
  options: AuthBasedApiOptions,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const inferenceAddress = await createOrGetInferenceAddress(options.voiceEngine, reqConfig.settings);
  const streamOptions: AxiosRequestConfig = {
    method: 'POST',
    url: inferenceAddress,
    headers: {
      accept: outputFormatToMimeType(options.outputFormat),
    },
    data: createPayloadForEngine(text, voice, options),
    responseType: 'stream',
    httpsAgent: keepAliveHttpsAgent,
    signal: reqConfig.signal,
  };

  const response = await axios(streamOptions).catch((error: any) => convertError(error));
  return response.data;
}

const outputFormatToMimeType = (outputFormat: V2ApiOptions['outputFormat'] | undefined): `audio/${string}` => {
  if (!outputFormat) {
    return outputFormatToMimeType('mp3');
  }
  switch (outputFormat) {
    case 'raw':
    // fallthrough
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
  }
};

const createPayloadForEngine = (
  text: string,
  voice: string,
  options: Play30EngineStreamOptions | PlayDialogEngineStreamOptions,
) => {
  const common = {
    text,
    voice,
    quality: options.quality,
    output_format: options.outputFormat,
    speed: options.speed,
    sample_rate: options.sampleRate,
    seed: options.seed,
    temperature: options.temperature,
    voice_engine: options.voiceEngine,
    voice_guidance: options.voiceGuidance,
    text_guidance: options.textGuidance,
    style_guidance: options.styleGuidance,
  };
  switch (options.voiceEngine) {
    case 'Play3.0-mini':
      return {
        ...common,
        language: options.language,
      };
    case 'PlayDialog':
      return {
        ...common,
        voice_2: options.voiceId2,
        turn_prefix: options.turnPrefix,
        turn_prefix_2: options.turnPrefix2,
        prompt: options.prompt,
        prompt_2: options.prompt2,
        voice_conditioning_seconds: options.voiceConditioningSeconds,
        voice_conditioning_seconds_2: options.voiceConditioningSeconds2,
      };
  }
};

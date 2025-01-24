import type { AuthBasedEngineOptions } from '../../../apiCommon';
import type {
  Play30EngineStreamOptions,
  Play30MiniOutputStreamFormat,
  PlayDialogEngineStreamOptions,
} from '../../../../index';
import axios, { AxiosRequestConfig } from 'axios';
import { convertError } from '../../convertError';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine } from './V3InternalSettings';

export async function generateAuthBasedStream(
  text: string,
  voice: string,
  options: AuthBasedEngineOptions,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const inferenceAddress = await createOrGetInferenceAddress(getInternalEngineForEndpoint(options), reqConfig.settings);
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

const outputFormatToMimeType = (outputFormat: Play30MiniOutputStreamFormat | undefined): `audio/${string}` => {
  if (!outputFormat) {
    return outputFormatToMimeType('mp3');
  }
  switch (outputFormat) {
    case 'raw':
    // fallthrough
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    case 'mp3':
      return 'audio/mpeg';
    case 'mulaw':
      return 'audio/basic';
    case 'wav_mulaw':
      return 'audio/wav';
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
    output_format: options.outputFormat,
    speed: options.speed,
    sample_rate: options.sampleRate,
    seed: options.seed,
    temperature: options.temperature,
    voice_engine: options.voiceEngine,
    language: options.language,
  };
  switch (options.voiceEngine) {
    case 'Play3.0-mini':
      return {
        ...common,
        quality: options.quality,
        voice_guidance: options.voiceGuidance,
        text_guidance: options.textGuidance,
        style_guidance: options.styleGuidance,
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

// visible for test
export const getInternalEngineForEndpoint = (options: AuthBasedEngineOptions): InternalAuthBasedEngine => {
  switch (options.voiceEngine) {
    case 'Play3.0-mini':
      return 'Play3.0-mini';
    case 'PlayDialog':
      if (options.language && options.language !== 'english') return 'PlayDialogMultilingual';
      return 'PlayDialog';
  }
};

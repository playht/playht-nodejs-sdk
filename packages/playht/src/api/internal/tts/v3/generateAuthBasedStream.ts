import type { AuthBasedEngineOptions } from '../../../apiCommon';
import type { Play30EngineStreamOptions, PlayDialogEngineStreamOptions } from '../../../../index';
import { AxiosRequestConfig } from 'axios';
import { convertError } from '../../convertError';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfigWithDefaults } from '../../config/PlayRequestConfig';
import { SDKSettings } from '../../../APISettingsStore';
import { debugLog } from '../../debug/debugLog';
import { extractErrorHeadersAndStatusIfTheyExist, getAxiosClient } from '../../config/getAxiosClient';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine } from './V3InternalSettings';

export async function generateAuthBasedStream(
  text: string,
  voice: string,
  options: AuthBasedEngineOptions,
  reqConfig: PlayRequestConfigWithDefaults,
): Promise<NodeJS.ReadableStream> {
  const inferenceAddress = await createOrGetInferenceAddress(getInternalEngineForEndpoint(options), reqConfig.settings);
  const payloadForEngine = createPayloadForEngine(text, voice, options);
  const streamOptions = {
    method: 'POST',
    url: inferenceAddress,
    data: payloadForEngine,
    responseType: 'stream',
    httpsAgent: keepAliveHttpsAgent,
    signal: reqConfig.signal,
  } as const satisfies AxiosRequestConfig;

  const response = await getAxiosClient(reqConfig.settings)(streamOptions).catch((error: any) => {
    debugRequest(
      reqConfig.settings,
      inferenceAddress,
      payloadForEngine,
      extractErrorHeadersAndStatusIfTheyExist(error),
    );
    return convertError(error, { request_id: error?.response?.headers['x-fal-request-id'] });
  });
  debugRequest(reqConfig.settings, inferenceAddress, payloadForEngine, response);
  return response.data;
}

function debugRequest(
  sdkSettings: Partial<SDKSettings> | undefined,
  inferenceAddress: string,
  payloadForEngine: any,
  response: { headers: Record<string, any>; status: number; errorMessage?: string },
) {
  debugLog(
    sdkSettings,
    `Request - Inference Backend: ${inferenceAddress.replace(/.*\/(.*?)\/stream.*/, '$1')} - Params: ${JSON.stringify(
      payloadForEngine,
    )} - Request-ID: ${response.headers['x-fal-request-id']} - Status: ${response.status}${
      response.errorMessage ? ` - Error: ${response.errorMessage}` : ''
    }`,
  );
}

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
      if (options.language === 'arabic') return 'PlayDialogArabic';
      if (options.language === 'hindi') return 'PlayDialogHindi';
      if (options.language && options.language !== 'english') return 'PlayDialogMultilingual';
      return 'PlayDialog';
  }
};

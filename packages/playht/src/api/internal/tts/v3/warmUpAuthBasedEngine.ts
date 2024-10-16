import axios, { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { AuthBasedEngines } from './V3InternalSettings';

export const warmUpAuthBasedEngine = async (engine: AuthBasedEngines, reqConfigSettings: PlayRequestConfig['settings']) => {
  const inferenceAddress = await createOrGetInferenceAddress(engine, reqConfigSettings);
  const streamOptions: AxiosRequestConfig = {
    method: 'OPTIONS',
    url: inferenceAddress,
    headers: {
      Origin: 'https://play.ht',
      'Access-Control-Request-Method': '*',
    },
    httpsAgent: keepAliveHttpsAgent,
  };
  // Trigger call to complete TCP handshake ahead of time
  axios(streamOptions).catch((error: any) => {
    // eslint-disable-next-line no-process-env
    if (process.env.DEBUG) {
      console.log(`[PlayHT SDK] Error response from warmUpV3: ${error.message}`);
    }
  });
};

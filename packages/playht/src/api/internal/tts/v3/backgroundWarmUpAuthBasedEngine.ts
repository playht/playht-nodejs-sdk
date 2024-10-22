import axios, { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { AuthBasedEngines } from './V3InternalSettings';

export const backgroundWarmUpAuthBasedEngine = (
  engine: AuthBasedEngines,
  reqConfigSettings: PlayRequestConfig['settings'],
) => {
  warmUp(engine, reqConfigSettings).catch((error: any) => {
    // eslint-disable-next-line no-process-env
    console.log(`[PlayHT SDK] Error while warming up SDK: ${error.message}`, process.env.DEBUG ? error : '');
  });
};

const warmUp = async (engine: AuthBasedEngines, reqConfigSettings: PlayRequestConfig['settings']) => {
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
  return axios(streamOptions);
};

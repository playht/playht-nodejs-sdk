import axios, { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

export const backgroundWarmUpAuthBasedEngine = (reqConfigSettings: PlayRequestConfig['settings']) => {
  warmUp(reqConfigSettings).catch((error: any) => {
    // eslint-disable-next-line no-process-env
    console.log(`[PlayHT SDK] Error while warming up SDK: ${error.message}`, process.env.DEBUG ? error : '');
  });
};

const warmUp = async (reqConfigSettings: PlayRequestConfig['settings']) => {
  const inferenceAddress = await createOrGetInferenceAddress(reqConfigSettings);
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

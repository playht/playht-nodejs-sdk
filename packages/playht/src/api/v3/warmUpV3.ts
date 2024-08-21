import axios, { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../internal/http';
import { PlayRequestConfig } from '../config/PlayRequestConfig';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';

export async function warmUpV3(reqConfigSettings: PlayRequestConfig['settings']) {
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
  axios(streamOptions).catch((error: any) => {
    // eslint-disable-next-line no-process-env
    if (process.env.DEBUG) {
      console.log(`[PlayHT SDK] Error response from warmUpV3: ${error.message}`);
    }
  });
}

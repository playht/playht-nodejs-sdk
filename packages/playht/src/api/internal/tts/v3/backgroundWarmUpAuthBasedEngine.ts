import { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfig } from '../../config/PlayRequestConfig';
import { getAxiosClient } from '../../config/getAxiosClient';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine, PublicAuthBasedEngine } from './V3InternalSettings';

export const backgroundWarmUpAuthBasedEngine = (
  selectedEngine: PublicAuthBasedEngine,
  reqConfigSettings: PlayRequestConfig['settings'],
) => {
  const engines =
    selectedEngine === 'Play3.0-mini'
      ? (['Play3.0-mini'] as const)
      : (['PlayDialog', 'PlayDialogMultilingual'] as const);
  for (const engine of engines) {
    warmUp(engine, reqConfigSettings).catch((error: any) => {
      console.log(
        `[PlayHT SDK] Error while warming up SDK (${engine}): ${error.message}`,
        // eslint-disable-next-line no-process-env
        reqConfigSettings.debug?.enabled ? error : '',
      );
    });
  }
};

const warmUp = async (engine: InternalAuthBasedEngine, reqConfigSettings: PlayRequestConfig['settings']) => {
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
  return getAxiosClient(reqConfigSettings)(streamOptions);
};

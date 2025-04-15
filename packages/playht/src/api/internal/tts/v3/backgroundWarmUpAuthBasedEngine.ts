import { AxiosRequestConfig } from 'axios';
import { keepAliveHttpsAgent } from '../../http';
import { PlayRequestConfigWithDefaults } from '../../config/PlayRequestConfig';
import { getAxiosClient } from '../../config/getAxiosClient';
import { createOrGetInferenceAddress } from './createOrGetInferenceAddress';
import { InternalAuthBasedEngine, PublicAuthBasedEngine } from './V3InternalSettings';

export const backgroundWarmUpAuthBasedEngine = (
  selectedEngine: PublicAuthBasedEngine,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
) => {
  const engines =
    selectedEngine === 'Play3.0-mini'
      ? (['Play3.0-mini'] as const)
      : (['PlayDialog', 'PlayDialogMultilingual'] as const);
  for (const engine of engines) {
    warmUp(engine, reqConfigSettings).catch((error: any) => {
      console.log(
        `[PlayHT SDK] Error while warming up SDK (${engine}): ${error.message}`,
        reqConfigSettings.debug?.enabled ? error : '',
      );
    });
  }
};

const warmUp = async (
  engine: InternalAuthBasedEngine,
  reqConfigSettings: PlayRequestConfigWithDefaults['settings'],
) => {
  const inferenceAddress = await createOrGetInferenceAddress(engine, reqConfigSettings);
  const streamOptions = {
    method: 'OPTIONS',
    url: inferenceAddress,
    headers: {
      Origin: 'https://play.ht',
      'Access-Control-Request-Method': '*',
    },
    httpsAgent: keepAliveHttpsAgent,
  } as const satisfies AxiosRequestConfig;
  // Trigger call to complete TCP handshake ahead of time
  return getAxiosClient(reqConfigSettings)(streamOptions);
};

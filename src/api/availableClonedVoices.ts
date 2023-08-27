import axios from 'axios';
import { V2APIVoiceInfo, V2VoiceInfo } from './availableV2Voices';
import { APISettings } from '..';

let _clonedVoicesCache: Array<V2VoiceInfo>;

export default async function availableClonedVoices(settings: APISettings): Promise<Array<V2VoiceInfo>> {
  const { apiKey, userId } = settings;
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v2/cloned-voices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  if (_clonedVoicesCache) {
    return _clonedVoicesCache;
  }

  _clonedVoicesCache = await axios
    .request(options)
    .then(({ data }: { data: Array<V2APIVoiceInfo> }) =>
      data.map((v) => ({
        engineType: 'PlayHT1.0' as const,
        is_cloned: true,
        ...v,
      })),
    )
    .catch(function (error) {
      throw new Error(error);
    });

  return _clonedVoicesCache;
}

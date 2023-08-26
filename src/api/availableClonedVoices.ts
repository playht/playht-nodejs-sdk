import axios from 'axios';
import { V2VoiceInfo } from './availableV2Voices';

export default async function availableClonedVoices(apiKey: string, userId: string): Promise<Array<V2VoiceInfo>> {
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v2/cloned-voices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  return await axios
    .request(options)
    .then(({ data }: { data: Array<V2VoiceInfo> }) => data.map((v) => ({ is_cloned: true, ...v })))
    .catch(function (error) {
      throw new Error(error);
    });
}

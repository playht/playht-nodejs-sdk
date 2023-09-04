import axios from 'axios';
import APISettingsStore from './APISettingsStore';
import { VoiceInfo } from '..';

type ClonedAPIVoiceInfo = {
  id: string;
  name: string;
  gender?: 'male' | 'female';
};

let _clonedVoicesCache: Array<VoiceInfo>;

export default async function availableClonedVoices(): Promise<Array<VoiceInfo>> {
  const { apiKey, userId } = APISettingsStore.getSettings();
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
    .then(
      ({ data }: { data: Array<ClonedAPIVoiceInfo> }): Array<VoiceInfo> =>
        data.map((voice) => ({
          voiceEngine: 'PlayHT1.0' as const,
          isCloned: true,
          id: voice.id,
          name: voice.name,
          gender: voice.gender,
        })),
    )
    .catch(function (error) {
      throw new Error(error);
    });

  return _clonedVoicesCache;
}

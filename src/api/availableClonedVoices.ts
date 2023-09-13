import type { VoiceInfo } from '..';
import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';

type ClonedAPIVoiceInfo = {
  id: string;
  name: string;
  gender?: 'male' | 'female';
};

let _clonedVoicesCache: Array<VoiceInfo>;

export function convertResponseToVoiceInfo(voice: ClonedAPIVoiceInfo): VoiceInfo {
  return {
    voiceEngine: 'PlayHT2.0' as const,
    isCloned: true,
    id: voice.id,
    name: voice.name,
    gender: voice.gender,
  };
}

export async function availableClonedVoices(): Promise<Array<VoiceInfo>> {
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
    .then(({ data }: { data: Array<ClonedAPIVoiceInfo> }): Array<VoiceInfo> => data.map(convertResponseToVoiceInfo))
    .catch(function (error) {
      throw new Error(error);
    });

  return _clonedVoicesCache;
}

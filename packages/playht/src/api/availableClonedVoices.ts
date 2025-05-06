import type { VoiceEngine, VoiceInfo } from '..';
import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';
import { PLAY_SDK_VERSION } from './internal/sdkVersion';

type ClonedAPIVoiceInfo = {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  voice_engine?: VoiceEngine;
};

export function convertResponseToVoiceInfo(voice: ClonedAPIVoiceInfo): VoiceInfo {
  return {
    voiceEngine: voice.voice_engine || ('PlayHT1.0' as const),
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
    url: 'https://api.play.ht/api/v2/cloned-voices',
    headers: {
      accept: 'application/json',
      authorization: apiKey,
      'x-user-id': userId,
      'x-play-sdk-version': PLAY_SDK_VERSION,
    },
  };

  return await axios
    .request(options)
    .then(({ data }: { data: Array<ClonedAPIVoiceInfo> }): Array<VoiceInfo> => data.map(convertResponseToVoiceInfo))
    .catch(function (error) {
      throw {
        message: error.response?.data?.error_message || error.message,
        code: error.code,
        statusCode: error.response?.statusCode,
        statusMessage: error.response?.statusMessage,
      };
    });
}

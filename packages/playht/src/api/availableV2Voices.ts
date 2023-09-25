import type { VoiceAgeGroup, VoiceEngine, VoiceInfo } from '..';
import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';

export type V2APIVoiceInfo = {
  id: string;
  name: string;
  sample?: string | null;
  accent?: string;
  age?: 'old' | 'adult' | 'youth' | null;
  gender?: 'male' | 'female';
  language?: string;
  language_code?: string;
  loudness?: number | null;
  style?: string | null;
  tempo?: number | null;
  texture?: string | null;
  is_cloned?: boolean;
  type?: string;
  voice_engine?: VoiceEngine;
};

const CACHE_EXPIRE_TIME = 1000 * 60 * 60 * 12; // 12 hours

let _v2VoicesCache: Array<VoiceInfo>;
let _cacheUpdatedTime: number;

export async function availableV2Voices(): Promise<Array<VoiceInfo>> {
  const { apiKey, userId } = APISettingsStore.getSettings();
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v2/voices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  if (_v2VoicesCache && _cacheUpdatedTime && Date.now() - _cacheUpdatedTime < CACHE_EXPIRE_TIME) {
    return _v2VoicesCache;
  }

  _v2VoicesCache = await axios
    .request(options)
    .then(({ data }: { data: Array<V2APIVoiceInfo> }) =>
      data.map((v2Voice) => ({
        voiceEngine: v2Voice.voice_engine || ('PlayHT1.0' as const),
        id: v2Voice.id,
        name: v2Voice.name,
        sampleUrl: v2Voice.sample ? v2Voice.sample : undefined,
        language: v2Voice.language,
        languageCode: v2Voice.language_code,
        gender: v2Voice.gender,
        ageGroup: toAgeGroup(v2Voice.age),
        styles: v2Voice.style ? [v2Voice.style] : undefined,
        isCloned: false,
      })),
    )
    .catch(function (error) {
      throw new Error(error);
    });

  _cacheUpdatedTime = Date.now();
  return _v2VoicesCache;
}

function toAgeGroup(age?: 'old' | 'adult' | 'youth' | null): VoiceAgeGroup | undefined {
  if (!age) {
    return undefined;
  }

  switch (age) {
    case 'old':
      return 'senior';
    case 'adult':
      return 'adult';
    case 'youth':
      return 'youth';
    default:
      return undefined;
  }
}

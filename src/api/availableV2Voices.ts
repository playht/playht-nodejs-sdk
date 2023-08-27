import axios from 'axios';
import { APISettings } from '..';

// Type for the SDK
export type V2VoiceInfo = {
  engineType: 'PlayHT1.0';
} & V2APIVoiceInfo;

export type V2APIVoiceInfo = {
  id: string;
  name: string;
  sample?: string | null;
  accent?: string;
  age?: number | null;
  gender?: string;
  language?: string;
  language_code?: string;
  loudness?: number | null;
  style?: string | null;
  tempo?: number | null;
  texture?: string | null;
  is_cloned?: boolean;
  type?: string;
};

let _v2VoicesCache: Array<V2VoiceInfo>;

export default async function availableV2Voices(settings: APISettings): Promise<Array<V2VoiceInfo>> {
  const { apiKey, userId } = settings;
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v2/voices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  if (_v2VoicesCache) {
    return _v2VoicesCache;
  }

  _v2VoicesCache = await axios
    .request(options)
    .then(({ data }: { data: Array<V2APIVoiceInfo> }) =>
      data.map((v2) => ({
        engineType: 'PlayHT1.0' as const,
        ...v2,
      })),
    )
    .catch(function (error) {
      throw new Error(error);
    });

  return _v2VoicesCache;
}

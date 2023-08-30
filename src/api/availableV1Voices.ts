import axios from 'axios';
import { APISettingsInput } from '..';

// Type for the SDK
export type V1VoiceInfo = {
  engineType: 'Standard';
} & V1APIVoiceInfo;

// What the server returns
type V1APIVoicesData = {
  voices: Array<V1APIVoiceInfo>;
};

type V1APIVoiceInfo = {
  value: string;
  name: string;
  language: string;
  voiceType: string;
  languageCode: string;
  gender: string;
  service: string;
  sample: string;
  isNew?: boolean;
  isKid?: boolean;
  styles?: Array<string>;
};

let _v1VoicesCache: Array<V1VoiceInfo>;

export default async function availableV1Voices(settings: APISettingsInput): Promise<Array<V1VoiceInfo>> {
  const { apiKey, userId } = settings;
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v1/getVoices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  if (_v1VoicesCache) {
    return _v1VoicesCache;
  }

  _v1VoicesCache = await axios
    .request(options)
    .then(({ data }: { data: V1APIVoicesData }) =>
      data.voices.map((v1) => ({
        engineType: 'Standard' as const,
        ...v1,
      })),
    )
    .catch(function (error) {
      throw new Error(error);
    });

  return _v1VoicesCache;
}

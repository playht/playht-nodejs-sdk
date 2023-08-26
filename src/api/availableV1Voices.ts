import axios from 'axios';

type v1VoicesData = {
  voices: Array<V1VoiceInfo>;
};

export type V1VoiceInfo = {
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

export default async function availableV1Voices(apiKey: string, userId: string): Promise<Array<V1VoiceInfo>> {
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v1/getVoices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  return await axios
    .request(options)
    .then(({ data }: { data: v1VoicesData }) => data.voices)
    .catch(function (error) {
      throw new Error(error);
    });
}

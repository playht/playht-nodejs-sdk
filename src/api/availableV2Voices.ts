import axios from 'axios';

export type V2VoiceInfo = {
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
  engine?: 'parrot' | 'peregrine';
  type?: string;
};

export default async function availableV2Voices(apiKey: string, userId: string): Promise<Array<V2VoiceInfo>> {
  const options = {
    method: 'GET',
    url: 'https://play.ht/api/v2/voices',
    headers: {
      accept: 'application/json',
      AUTHORIZATION: apiKey,
      'X-USER-ID': userId,
    },
  };

  return await axios
    .request(options)
    .then(({ data }: { data: Array<V2VoiceInfo> }) => data)
    .catch(function (error) {
      throw new Error(error);
    });
}

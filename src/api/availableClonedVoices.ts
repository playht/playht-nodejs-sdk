import axios from 'axios';

export type ClonedVoiceInfo = {
  id: string;
  name: string;
  type: string;
  gender: string | null;
};

export async function availableClonedVoices(apiKey: string, userId: string): Promise<Array<ClonedVoiceInfo>> {
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
    .then(({ data }: { data: Array<ClonedVoiceInfo> }) => data)
    .catch(function (error) {
      throw new Error(error);
    });
}

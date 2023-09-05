import axios from 'axios';
import { APISettingsStore } from './APISettingsStore';
import { convertResponseToVoiceInfo } from './availableClonedVoices';

const API_URL = 'https://play.ht/api/v2/cloned-voices/instant';

export async function instantCloneFromFileInternal(voiceName: string, fileBlob: Buffer, contentType: string) {
  const { apiKey, userId } = APISettingsStore.getSettings();

  const formData = new FormData();
  formData.append('sample_file', new Blob([fileBlob], { type: contentType }));
  formData.append('voice_name', voiceName);

  return await axios
    .post(API_URL, formData, {
      headers: {
        accept: 'application/json',
        AUTHORIZATION: apiKey,
        'X-USER-ID': userId,
        'content-type': 'multipart/form-data',
      },
    })
    .then(({ data }) => convertResponseToVoiceInfo(data))
    .catch(function (error) {
      throw new Error(error);
    });
}

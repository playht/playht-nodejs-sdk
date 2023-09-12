import type { VoiceInfo } from '..';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { APISettingsStore } from './APISettingsStore';
import { convertResponseToVoiceInfo } from './availableClonedVoices';

const API_URL = 'https://play.ht/api/v2/cloned-voices/instant';

export async function instantCloneFromFileInternal(
  voiceName: string,
  fileBlob: Buffer,
  mimeType?: string,
): Promise<VoiceInfo> {
  const { apiKey, userId } = APISettingsStore.getSettings();

  if (!mimeType) {
    mimeType = (await fileTypeFromBuffer(fileBlob))?.mime;
  }

  if (!mimeType) {
    throw new Error('Could not determine mime type of file. Please provide a mime type.');
  }

  const formData = new FormData();
  formData.append('sample_file', new Blob([fileBlob], { type: mimeType }));
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
      throw {
        message: error.response?.data?.error_message || error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
      };
    });
}

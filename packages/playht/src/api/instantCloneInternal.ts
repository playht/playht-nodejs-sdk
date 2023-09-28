import type { VoiceGender, VoiceInfo } from '..';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { APISettingsStore } from './APISettingsStore';
import { convertResponseToVoiceInfo } from './availableClonedVoices';

const API_URL = 'https://play.ht/api/v2/cloned-voices/instant';

export async function commonInstantClone(
  voiceName: string,
  input: string | Buffer,
  voiceGender?: VoiceGender,
  mimeType?: string,
): Promise<VoiceInfo> {
  if (typeof input === 'string') {
    return await internalInstantClone(voiceName, input, voiceGender, mimeType);
  } else if (Buffer.isBuffer(input)) {
    if (!mimeType) {
      mimeType = (await fileTypeFromBuffer(input))?.mime;
    }
    if (!mimeType) {
      throw {
        message: 'Could not determine mime type of file. Please provide a mime type.',
        code: 'INVALID_MIME_TYPE',
      };
    }

    return await internalInstantClone(voiceName, input, voiceGender, mimeType);
  }

  throw {
    message: 'Invalid input type for cloning voice. Please provide a string or a buffer.',
    code: 'INVALID_INPUT_TYPE_FOR_CLONING',
  };
}

async function internalInstantClone(
  voiceName: string,
  input: string | Buffer,
  voiceGender?: VoiceGender,
  mimeType?: string,
): Promise<VoiceInfo> {
  const { apiKey, userId } = APISettingsStore.getSettings();

  const formData = new FormData();
  if (typeof input === 'string') {
    formData.append('sample_file_url', input);
  } else {
    formData.append('sample_file', new Blob([input], { type: mimeType }));
  }
  formData.append('voice_name', voiceName);
  if (voiceGender) {
    formData.append('gender', voiceGender);
  }

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
        statusCode: error.response?.statusCode,
        statusMessage: error.response?.statusMessage,
      };
    });
}

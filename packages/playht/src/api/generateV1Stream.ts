import type { V1ApiOptions } from './apiCommon';
import axios from 'axios';
import { generateV1Speech } from './generateV1Speech';
import { PLAY_SDK_VERSION } from './internal/sdkVersion';

export async function generateV1Stream(
  content: string,
  voice: string,
  options?: V1ApiOptions,
): Promise<NodeJS.ReadableStream> {
  const generated = await generateV1Speech(content, voice, options);

  const response = await axios({
    url: generated.audioUrl,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'x-play-sdk-version': PLAY_SDK_VERSION,
    }
  }).catch((error: any) => {
    throw {
      message: error.response?.data?.error_message || error.message,
      code: error.code,
      statusCode: error.response?.statusCode,
      statusMessage: error.response?.statusMessage,
    };
  });

  return response.data;
}

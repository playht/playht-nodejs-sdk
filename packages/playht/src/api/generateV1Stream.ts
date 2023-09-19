import type { V1ApiOptions } from './apiCommon';
import axios from 'axios';
import { generateV1Speech } from './generateV1Speech';

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
  }).catch((error: any) => {
    throw new Error(error);
  });

  return response.data;
}

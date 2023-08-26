import { v1ApiOptions } from '..';
import generateV1Speech from './generateV1Speech';
import axios from 'axios';

export default async function generateV1Stream(
  apiKey: string,
  userId: string,
  content: Array<string>,
  voice: string,
  outputStream: NodeJS.WritableStream,
  options?: v1ApiOptions,
): Promise<void> {
  const generated = await generateV1Speech(apiKey, userId, content, voice, options);

  const url = Array.isArray(generated.audioUrl) ? generated.audioUrl[0] : generated.audioUrl;

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  }).catch((error: any) => {
    throw new Error(error);
  });

  response.data.pipe(outputStream);
}

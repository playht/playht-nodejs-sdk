import generateV1Speech from './generateV1Speech';
import axios from 'axios';
import { V1ApiOptions } from './v1Common';

export default async function generateV1Stream(
  content: string,
  voice: string,
  outputStream: NodeJS.WritableStream,
  options?: V1ApiOptions,
): Promise<void> {
  const generated = await generateV1Speech(content, voice, options);

  const response = await axios({
    url: generated.audioUrl,
    method: 'GET',
    responseType: 'stream',
  }).catch((error: any) => {
    throw new Error(error);
  });

  response.data.pipe(outputStream);
}

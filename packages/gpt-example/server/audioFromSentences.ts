import * as PlayHTAPI from '@playht/playht';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import PQueue from 'p-queue';

const pipelineAsync = promisify(pipeline);

export async function audioFromSentences(
  sentencesStream: AsyncGenerator<string>,
  writableStream: NodeJS.WritableStream,
) {
  // Create a cuncurrency queue to limit the number of concurrent API calls
  const queue = new PQueue({ concurrency: 3 });

  // For each sentence in the stream, add a task to the queue
  for await (const sentence of sentencesStream) {
    (async () => {
      await queue.add(async () => {
        const currentStreamPromise = await PlayHTAPI.streamSpeech(sentence);

        // Pipe the result of the API call to the writable stream, keeping the writable stream open
        await pipelineAsync(currentStreamPromise, writableStream, { end: false });
      });
    })();
  }
  // Wait for all tasks to be completed
  await queue.onIdle();

  // Close the writable stream
  writableStream.end();
}

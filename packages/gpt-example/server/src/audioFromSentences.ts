import * as PlayHTAPI from '@playht/playht';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import PQueue from 'p-queue';

const pipelineAsync = promisify(pipeline);

export async function audioFromSentences(
  sentencesStream: AsyncGenerator<string>,
  writableStream: NodeJS.WritableStream,
) {
  // Create a concurrency queue to call the streaming API
  const concurrencyQueue = new PQueue({ concurrency: 5 });
  // Create an array to keep track of the order of the API calls
  const orderedPromises = [];

  // For each sentence in the stream, add a task to the queue
  for await (const sentence of sentencesStream) {
    // Use an async immediately invoked function expression to enqueue a promise without blocking execution.
    orderedPromises.push(
      (async () => {
        const currentStreamPromise = PlayHTAPI.streamSpeech(sentence);
        return await concurrencyQueue.add(() => currentStreamPromise);
      })(),
    );
  }

  // Wait for each API call to finish in order
  while (orderedPromises.length > 0) {
    const nextStreamPromise = orderedPromises.shift();
    const resultStream = await nextStreamPromise;

    if (!resultStream) {
      throw new Error('Stream is undefined');
    }

    // Pipe the result of the API call to the writable stream, keeping the writable stream open
    await pipelineAsync(resultStream, writableStream, { end: false });
  }

  // Close the writable stream
  writableStream.end();
}

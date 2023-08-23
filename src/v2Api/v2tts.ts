import type { v2ApiOptions } from '../index';
import https from 'https';

const CONNECTION_TIMEOUT = 30 * 1000; // 30s
const INNACTIVITY_TIMEOUT = 20 * 1000; // 20s

export type v2SpeechResult = {
  id: string;
  url: string;
  duration: number;
  size: number;
};

export function generateV2Speech(
  apiKey: string,
  userId: string,
  text: string,
  voice: string,
  options?: v2ApiOptions,
): Promise<v2SpeechResult> {
  const requestOptions: https.RequestOptions = {
    method: 'POST',
    hostname: 'play.ht',
    path: 'api/v2/tts',
    headers: {
      AUTHORIZATION: `Bearer ${apiKey}`,
      'X-USER-ID': userId,
      'Content-Type': 'application/json',
      accept: 'text/event-stream',
    },
    timeout: CONNECTION_TIMEOUT,
  };

  const body = {
    text,
    voice,
    quality: options?.quality || 'medium',
    output_format: options?.outputFormat || 'mp3',
    speed: options?.speed || 1,
    sample_rate: options?.sampleRate || 24000,
    seed: options?.seed,
    temperature: options?.temperature,
  };

  return new Promise<v2SpeechResult>((resolve, reject) => {
    let headersSent = false;
    let buffer = '';
    let isResolved = false;
    const onEvent = (incomingData: string) => {
      const incomingText = incomingData.toString();

      const [eventTypeRaw, dataRaw] = incomingText.split(/\r?\n/);
      if (!eventTypeRaw?.includes('event: ') || !dataRaw?.includes('data: ')) {
        throw new Error(`Unexpected text format. Expected event/data but received: "${incomingText}".`);
      }

      const eventName = eventTypeRaw?.replace(/^event: /, '');
      if (eventName === 'completed') {
        const eventData = dataRaw && JSON.parse(dataRaw.replace(/^data: /, ''));
        isResolved = true;
        resolve({
          id: eventData.id,
          url: eventData.url,
          duration: eventData.duration,
          size: eventData.size,
        });
      }
    };

    const request = https.request(requestOptions, (res) => {
      res.on('data', (data) => {
        try {
          if (!headersSent && res.statusCode !== 200) {
            reject(new Error('Error communicating with the server.'));
            headersSent = true;
          } else {
            const { ready, remaining } = splitOnDoubleNewline(buffer + data.toString());
            buffer = remaining;
            if (ready !== null) {
              onEvent(ready);
            }
          }
        } catch (e) {
          reject(e);
        }
      });
      res.on('end', () => {
        if (buffer !== '') {
          onEvent(buffer);
        }
        if (!isResolved) {
          reject(new Error("Finished with no 'completed' event."));
        }
      });
      res.on('error', (error) => {
        if (error.message === 'aborted') {
          reject(
            new Error(`The server response exceeded the maximum inactivity timeout of ${INNACTIVITY_TIMEOUT / 1000}s`),
          );
        } else {
          reject(error);
        }
      });
    });
    request.on('error', (error) => {
      if (error.message === 'socket hang up') {
        reject(
          new Error(
            `Exceeded the maximum timeout of ${CONNECTION_TIMEOUT / 1000}s while attempting to establish connection.`,
          ),
        );
      } else {
        reject(error);
      }
    });
    request.setTimeout(INNACTIVITY_TIMEOUT, () => {
      request.destroy(); // req.setTimeout() doesn't kill the connection by itself
    });

    request.write(JSON.stringify(body));
    request.end();
  });
}

// If theres \w+\r\n\r\n in the data string, assign everything up to it to `ready``, and everything after it to `remaining`
export function splitOnDoubleNewline(data: string): { ready: string | null; remaining: string } {
  const match = data.match(/[\s\S]*?\r\n\r\n/);
  if (match === null) return { ready: null, remaining: data };
  const matchIndexEnd = match[0].length;
  const [ready, remaining] = [data.slice(0, matchIndexEnd), data.slice(matchIndexEnd)];
  return { ready, remaining };
}

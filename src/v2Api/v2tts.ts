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
  //   const apiUrl = new URL('https://play.ht/api/v2/tts');
  const apiUrl = new URL('https://staging.play.ht/api/v2/tts');

  const requestOptions: https.RequestOptions = {
    method: 'POST',
    hostname: apiUrl.hostname,
    path: apiUrl.pathname,
    port: apiUrl.port,
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
    let isResolved = false;
    const onEvent = (eventName: string, eventData: any) => {
      if (eventName === 'completed') {
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
      res.on('data', (rawData) => {
        try {
          const data = rawData.toString();
          console.log('incoming>>', data, '<<', res.statusCode);
          if (!headersSent && res.statusCode !== 200) {
            if (data.includes('error_message')) {
              const result = JSON.parse(data);
              reject(new Error(result.error_message || 'Error communicating with the server.'));
            } else {
              reject(new Error('Error communicating with the server.'));
            }
            headersSent = true;
          } else {
            const { eventName, eventData } = getLastEvent(data);
            onEvent(eventName, eventData);
          }
        } catch (e) {
          reject(e);
        }
      });
      res.on('end', () => {
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

function getLastEvent(data: string): { eventName: string; eventData: any } {
  const EVENT_PREFIX = 'event: ';
  const DATA_PREFIX = 'data: ';
  const lines = data
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .reverse();

  const eventLine = lines.find((line) => line.startsWith(EVENT_PREFIX));
  const dataLine = lines.find((line) => line.startsWith(DATA_PREFIX));

  if (!eventLine || !dataLine) {
    throw new Error(`Unexpected text format. Expected event/data but received: "${data}".`);
  }

  const eventName = eventLine?.slice(EVENT_PREFIX.length);
  const eventData = JSON.parse(dataLine?.slice(DATA_PREFIX.length));

  return { eventName, eventData };
}

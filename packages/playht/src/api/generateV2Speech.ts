import type { V2ApiOptions } from './apiCommon';
import https from 'https';
import { APISettingsStore } from './APISettingsStore';
import { PLAY_SDK_VERSION } from './internal/sdkVersion';

const CONNECTION_TIMEOUT = 30 * 1000; // 30s
const INNACTIVITY_TIMEOUT = 20 * 1000; // 20s

export type V2SpeechResult = {
  id: string;
  url: string;
  duration: number;
  size: number;
};

export function generateV2Speech(text: string, voice: string, options?: V2ApiOptions): Promise<V2SpeechResult> {
  const apiUrl = new URL('https://api.play.ht/api/v2/tts');
  const { apiKey, userId } = APISettingsStore.getSettings();

  const requestOptions: https.RequestOptions = {
    method: 'POST',
    hostname: apiUrl.hostname,
    path: apiUrl.pathname,
    port: apiUrl.port,
    headers: {
      accept: 'text/event-stream',
      'Content-Type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'x-user-id': userId,
      'x-play-sdk-version': PLAY_SDK_VERSION,
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
    voice_engine: options?.voiceEngine,
    emotion: options?.emotion,
    voice_guidance: options?.voiceGuidance,
    text_guidance: options?.textGuidance,
    style_guidance: options?.styleGuidance,
  };

  return new Promise<V2SpeechResult>((resolve, reject) => {
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
          if (!headersSent && res.statusCode !== 200) {
            if (data.includes('error_message')) {
              const result = JSON.parse(data);
              reject({
                message: result.error_message || 'Error communicating with the server.',
                status: res.statusCode,
              });
            } else {
              reject({
                message: 'Error communicating with the server.',
                status: res.statusCode,
              });
            }
            headersSent = true;
          } else {
            const { eventName, eventData } = getLastEvent(data);
            onEvent(eventName, eventData);
          }
        } catch (error: any) {
          reject({
            message: error?.message || 'Error communicating with the server.',
            status: res.statusCode,
          });
        }
      });
      res.on('end', () => {
        if (!isResolved) {
          reject({
            message: "Finished with no 'completed' event.",
            status: 500,
          });
        }
      });
      res.on('error', (error) => {
        if (error.message === 'aborted') {
          reject({
            message: `The server response exceeded the maximum inactivity timeout of ${INNACTIVITY_TIMEOUT / 1000}s`,
            status: 500,
          });
        } else {
          reject({
            message: error?.message || 'Error communicating with the server.',
            status: res.statusCode,
          });
        }
      });
    });
    request.on('error', (error) => {
      if (error.message === 'socket hang up') {
        reject({
          message: `Exceeded the maximum timeout of ${
            CONNECTION_TIMEOUT / 1000
          }s while attempting to establish connection.`,
          status: 500,
        });
      } else {
        reject({
          message: error?.message || 'Error communicating with the server.',
          status: 500,
        });
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
  let eventData = {};
  if (eventName !== 'ping') {
    eventData = JSON.parse(dataLine?.slice(DATA_PREFIX.length));
  }

  return { eventName, eventData };
}

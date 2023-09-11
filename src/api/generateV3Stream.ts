import type { V2ApiOptions } from './apiCommon';
import { Writable } from 'node:stream';
import { Client, Format, Quality } from 'playht';
import { APISettingsStore } from './APISettingsStore';

export async function generateV3Stream(
  text: string,
  voice: string,
  outputStream: Writable,
  options?: V2ApiOptions,
): Promise<void> {
  const { apiKey, userId } = APISettingsStore.getSettings();

  const client = new Client({
    userId,
    apiKey,
  });

  // TODO: Convert quality and format to enum

  const stream = await client.tts({
    text: [text],
    voice,
    quality: Quality.QUALITY_DRAFT,
    format: Format.FORMAT_MP3,
    sampleRate: options?.sampleRate,
    speed: options?.speed,
    seed: options?.seed,
    temperature: options?.temperature,
  });

  stream.pipeTo(Writable.toWeb(outputStream));
}

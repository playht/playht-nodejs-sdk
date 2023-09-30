import type { OutputQuality, OutputFormat } from '..';
import type { V2ApiOptions } from './apiCommon';
import { Readable } from 'stream';
import { Format, Quality } from '../grpc-client/client';
import { playht } from '../grpc-client/protos/api';
import { APISettingsStore } from './APISettingsStore';

export async function generateGRpcStream(
  input: string,
  voice: string,
  options: V2ApiOptions,
): Promise<NodeJS.ReadableStream> {
  const gRpcClient = APISettingsStore.getGRpcClient();

  return convertToNodeReadable(
    await gRpcClient.tts({
      text: [input],
      voice,
      quality: convertQuality(options.quality),
      format: convertOutputFormat(options.outputFormat),
      sampleRate: options.sampleRate,
      speed: options.speed,
      seed: options.seed,
      temperature: options.temperature,
    }),
  );
}

function convertToNodeReadable(stream: ReadableStream<Uint8Array>): NodeJS.ReadableStream {
  const reader = stream.getReader();

  return new Readable({
    async read() {
      const { done, value } = await reader.read();

      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    },
    objectMode: false,
  });
}

const convertOutputFormat = (outputFormat?: OutputFormat): playht.v1.Format => {
  switch (outputFormat) {
    case 'mp3':
      return Format.FORMAT_MP3;
    case 'mulaw':
      return Format.FORMAT_MULAW;
    case 'wav':
      return Format.FORMAT_WAV;
    case 'ogg':
      return Format.FORMAT_OGG;
    case 'flac':
      return Format.FORMAT_FLAC;
    case undefined:
      return Format.FORMAT_MP3;
  }
};

const convertQuality = (quality?: OutputQuality): playht.v1.Quality => {
  switch (quality) {
    case 'draft':
      return Quality.QUALITY_DRAFT;
    case 'high':
      return Quality.QUALITY_HIGH;
    case 'low':
      return Quality.QUALITY_LOW;
    case 'medium':
      return Quality.QUALITY_MEDIUM;
    case 'premium':
      return Quality.QUALITY_PREMIUM;
    case undefined:
      return Quality.QUALITY_DRAFT;
  }
};

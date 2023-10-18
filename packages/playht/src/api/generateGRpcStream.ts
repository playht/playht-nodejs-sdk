import type { OutputQuality, Emotion, PlayHT20OutputStreamFormat } from '..';
import type { V2ApiOptions } from './apiCommon';
import { Readable } from 'stream';
import { Format, Quality } from '../grpc-client/client';
import { playht } from '../grpc-client/protos/api';
import { APISettingsStore } from './APISettingsStore';
import { splitSentences } from './sentenceSplit';
import { GRPC_STREAMING_LIMITS } from './constants';

export async function generateGRpcStream(
  input: string,
  voice: string,
  options: V2ApiOptions,
): Promise<NodeJS.ReadableStream> {
  const gRpcClient = APISettingsStore.getGRpcClient();

  let emotionCode = null;
  if (options.emotion) {
    emotionCode = emotionStringToNumber[options.emotion];
    if (!emotionCode) {
      throw 'Invalid emotion. Please use a gendered emotion.';
    }
  }

  const grpcInput = splitSentences(input);

  if (grpcInput.length > GRPC_STREAMING_LIMITS.MAX_NUMBER_OF_LINES) {
    throw 'Input too long. Please try with a shorter string.';
  }

  return convertToNodeReadable(
    await gRpcClient.tts({
      text: grpcInput,
      voice,
      quality: convertQuality(options.quality),
      format: convertOutputFormat(options.outputFormat),
      sampleRate: options.sampleRate,
      speed: options.speed,
      seed: options.seed,
      temperature: options.temperature,
      styleGuidance: options.styleGuidance,
      voiceGuidance: options.voiceGuidance,
      speechAttributes: emotionCode,
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

const convertOutputFormat = (outputFormat?: PlayHT20OutputStreamFormat): playht.v1.Format => {
  switch (outputFormat) {
    case 'raw':
      return Format.FORMAT_RAW;
    case 'mp3':
      return Format.FORMAT_MP3;
    case 'wav':
      return Format.FORMAT_WAV;
    case 'ogg':
      return Format.FORMAT_OGG;
    case 'flac':
      return Format.FORMAT_FLAC;
    case 'mulaw':
      return Format.FORMAT_MULAW;
    case undefined:
      return Format.FORMAT_MP3;
  }
};

const convertQuality = (quality?: OutputQuality): playht.v1.Quality | undefined => {
  switch (quality) {
    case 'draft':
      return Quality.QUALITY_DRAFT;
    case 'high':
    case 'low':
    case 'medium':
    case 'premium':
      return Quality.QUALITY_HIGH;
    case undefined:
      return undefined;
  }
};

export const emotionStringToNumber: Record<Emotion, number | undefined> = {
  female_happy: 3,
  female_sad: 5,
  female_angry: 0,
  female_fearful: 2,
  female_disgust: 1,
  female_surprised: 6,
  male_happy: 10,
  male_sad: 12,
  male_angry: 7,
  male_fearful: 9,
  male_disgust: 8,
  male_surprised: 13,
} as const;

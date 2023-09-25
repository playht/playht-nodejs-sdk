import type {
  OutputFormat,
  SpeechOptions,
  SpeechStreamOptions,
  SpeechOutput,
  OutputQuality,
  Emotion,
  VoiceEngine,
} from '..';
import { PassThrough, pipeline } from 'node:stream';
import { promisify } from 'node:util';
import PQueue from 'p-queue';
import { APISettingsStore } from './APISettingsStore';
import { generateV1Speech } from './generateV1Speech';
import { generateV1Stream } from './generateV1Stream';
import { generateV2Speech } from './generateV2Speech';
import { generateV2Stream } from './generateV2Stream';
import { textStreamToSentences } from './textStreamToSentences';

export type V1ApiOptions = {
  narrationStyle?: string;
  globalSpeed?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
  preset?: Preset;
};

export type V2ApiOptions = {
  voiceEngine: VoiceEngine;
  quality?: string;
  outputFormat?: OutputFormat;
  speed?: number;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
  emotion?: Emotion;
  voiceGuidance?: number;
  styleGuidance?: number;
};

type Preset = 'real-time' | 'balanced' | 'low-latency' | 'high-quality';

type SpeechOptionsWithVoiceID = SpeechOptions & { voiceId: string };

export async function commonGenerateSpeech(input: string, optionsInput?: SpeechOptions): Promise<SpeechOutput> {
  const options = addDefaultOptions(optionsInput);

  if (options.voiceEngine === 'Standard') {
    const v1Options = toV1Options(options);
    const result = await generateV1Speech(input, options.voiceId, v1Options);
    return {
      audioUrl: result.audioUrl,
      generationId: result.transcriptionId,
      message: result.message,
    };
  } else {
    const v2Options = toV2Options(options);
    const result = await generateV2Speech(input, options.voiceId, v2Options);
    return {
      audioUrl: result.url,
      generationId: result.id,
    };
  }
}

export async function commonGenerateStream(
  input: string,
  optionsInput?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  const options = addDefaultOptions(optionsInput);

  if (options.voiceEngine === 'Standard') {
    const v1Options = toV1Options(options);
    return await generateV1Stream(input, options.voiceId, v1Options);
  } else {
    const v2Options = toV2Options(options);
    return await generateV2Stream(input, options.voiceId, v2Options);
  }
}

export async function commonGenerateStreamFromInputStream(
  inputStream: NodeJS.ReadableStream,
  options?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  const stentencesStream = textStreamToSentences(inputStream);
  const passThrough = new PassThrough();
  audioStreamFromSentences(stentencesStream, passThrough, options);
  return passThrough;
}

export function qualityToPreset(quality?: OutputQuality): Preset {
  let preset: Preset = 'balanced';

  if (quality != null) {
    switch (quality) {
      case 'draft':
        preset = 'real-time';
        break;
      case 'low':
        preset = 'low-latency';
        break;
      case 'medium':
        preset = 'balanced';
        break;
      case 'high':
        preset = 'high-quality';
        break;
      case 'premium':
        preset = 'high-quality';
        break;
    }
  }
  return preset;
}

function addDefaultOptions(options?: SpeechOptions): SpeechOptionsWithVoiceID {
  const { defaultVoiceEngine, defaultVoiceId } = APISettingsStore.getSettings();
  return {
    voiceEngine: defaultVoiceEngine,
    voiceId: defaultVoiceId,
    ...options,
  };
}

function toV2Options(options: SpeechOptionsWithVoiceID): V2ApiOptions {
  if (options.voiceEngine !== 'PlayHT1.0' && options.voiceEngine !== 'PlayHT2.0') {
    throw new Error("Invalid engine. Expected 'PlayHT1.0' or 'PlayHT2.0'");
  }

  const v2Options: V2ApiOptions = {
    quality: options.quality,
    outputFormat: options.outputFormat,
    speed: options.speed,
    sampleRate: options.sampleRate,
    seed: options.seed,
    temperature: options.temperature,
    voiceEngine: options.voiceEngine,
  };

  if (options.voiceEngine === 'PlayHT2.0') {
    v2Options.emotion = options.emotion;
    v2Options.voiceGuidance = options.voiceGuidance;
    v2Options.styleGuidance = options.styleGuidance;
  }

  return v2Options;
}

function toV1Options(options: SpeechOptionsWithVoiceID): V1ApiOptions {
  if (options.voiceEngine !== 'Standard') {
    throw new Error("Invalid engine. Expected 'Standard'");
  }
  return {
    narrationStyle: options.narrationStyle,
    pronunciations: options.pronunciations,
    trimSilence: options.trimSilence,
    preset: qualityToPreset(options.quality),
    globalSpeed: `${Math.trunc((options.speed || 1) * 100)}%`,
  };
}

const pipelineAsync = promisify(pipeline);
const CONCURRENCY = 5;

async function audioStreamFromSentences(
  sentencesStream: AsyncGenerator<string>,
  writableStream: NodeJS.WritableStream,
  options?: SpeechStreamOptions,
) {
  // Create a concurrency queue to call the streaming API
  const concurrencyQueue = new PQueue({ concurrency: CONCURRENCY });

  // Create an array to keep track of the order of the API calls
  const orderedPromises = [];

  // For each sentence in the stream, add a task to the queue
  for await (const sentence of sentencesStream) {
    // Use an async immediately invoked function expression to enqueue a promise without blocking execution.
    orderedPromises.push(
      (async () => {
        const currentStreamPromise = commonGenerateStream(sentence, options);
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

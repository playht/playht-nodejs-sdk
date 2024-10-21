import type {
  SpeechOptions,
  SpeechStreamOptions,
  SpeechOutput,
  OutputQuality,
  Emotion,
  VoiceEngine,
  PlayHT10OutputStreamFormat,
  PlayHT20OutputStreamFormat,
  Play30EngineStreamOptions,
  OutputFormat,
} from '..';
import { PassThrough, Readable, Writable } from 'node:stream';
import { APISettingsStore } from './APISettingsStore';
import { generateV1Speech } from './generateV1Speech';
import { generateV1Stream } from './generateV1Stream';
import { generateV2Speech } from './generateV2Speech';
import { generateV2Stream } from './generateV2Stream';
import { textStreamToSentences } from './textStreamToSentences';
import { generateGRpcStream } from './generateGRpcStream';
import { generateV3Stream } from './internal/tts/v3/generateV3Stream';
import { PlayRequestConfig } from './internal/config/PlayRequestConfig';

export type V1ApiOptions = {
  narrationStyle?: string;
  globalSpeed?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
  preset?: Preset;
};

export type V2ApiOptions = {
  voiceEngine: VoiceEngine;
  quality?: OutputQuality;
  outputFormat?: OutputFormat | PlayHT10OutputStreamFormat | PlayHT20OutputStreamFormat;
  speed?: number;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
  emotion?: Emotion;
  voiceGuidance?: number;
  styleGuidance?: number;
  textGuidance?: number;
};

export type V3ApiOptions = Pick<Play30EngineStreamOptions, 'language' | 'voiceEngine'> &
  Omit<V2ApiOptions, 'voiceEngine' | 'emotion'>;

type Preset = 'real-time' | 'balanced' | 'low-latency' | 'high-quality';

type SpeechOptionsWithVoiceID = (SpeechStreamOptions | SpeechOptions) & { voiceId: string };

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
  input: string | NodeJS.ReadableStream,
  optionsInput: SpeechStreamOptions | undefined,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  if (typeof input === 'string') {
    return await internalGenerateStreamFromString(input, optionsInput, reqConfig);
  } else {
    return await internalGenerateStreamFromInputStream(input, optionsInput, reqConfig);
  }
}

export async function internalGenerateStreamFromString(
  input: string,
  optionsInput: SpeechStreamOptions | undefined,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const options = addDefaultOptions(optionsInput);

  switch (options.voiceEngine) {
    case 'Standard': {
      const v1Options = toV1Options(options);
      return await generateV1Stream(input, options.voiceId, v1Options);
    }
    case 'PlayHT1.0': {
      const v2Options = toV2Options(options, false);
      return await generateV2Stream(input, options.voiceId, v2Options);
    }
    case 'PlayHT2.0':
    case 'PlayHT2.0-turbo': {
      const v2Options = toV2Options(options, true);
      return await generateGRpcStream(input, options.voiceId, v2Options);
    }
    case 'Play3.0-mini': {
      return await generateV3Stream(input, options.voiceId, options, reqConfig);
    }
  }
}

export async function internalGenerateStreamFromInputStream(
  inputStream: NodeJS.ReadableStream,
  optionsInput: SpeechStreamOptions | undefined,
  reqConfig: PlayRequestConfig,
): Promise<NodeJS.ReadableStream> {
  const sentencesStream = textStreamToSentences(inputStream);
  const passThrough = new PassThrough();
  void audioStreamFromSentences(sentencesStream, passThrough, optionsInput, reqConfig);
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

function addDefaultOptions(options?: SpeechOptions | SpeechStreamOptions): SpeechOptionsWithVoiceID {
  const { defaultVoiceEngine, defaultVoiceId } = APISettingsStore.getSettings();
  return {
    voiceEngine: defaultVoiceEngine,
    voiceId: defaultVoiceId,
    ...options,
  };
}

function toV2Options(options: SpeechOptionsWithVoiceID, isPlay20Streaming = false): V2ApiOptions {
  if (options.voiceEngine === 'PlayHT2.0-turbo' && !isPlay20Streaming) {
    throw {
      message: "Invalid engine. The 'PlayHT2.0-turbo' engine is only supported for streaming.",
      code: 'INVALID_ENGINE',
    };
  }

  if (
    options.voiceEngine !== 'PlayHT1.0' &&
    options.voiceEngine !== 'PlayHT2.0' &&
    options.voiceEngine !== 'PlayHT2.0-turbo'
  ) {
    throw {
      message: "Invalid engine. Expected 'PlayHT2.0', 'PlayHT2.0-turbo' or 'PlayHT1.0'",
      code: 'INVALID_ENGINE',
    };
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

  if (options.voiceEngine === 'PlayHT2.0' || options.voiceEngine === 'PlayHT2.0-turbo') {
    v2Options.emotion = options.emotion;
    v2Options.voiceGuidance = options.voiceGuidance;
    v2Options.styleGuidance = options.styleGuidance;
    v2Options.textGuidance = options.textGuidance;
  }

  return v2Options;
}

function toV1Options(options: SpeechOptionsWithVoiceID): V1ApiOptions {
  if (options.voiceEngine !== 'Standard') {
    throw {
      message: "Invalid engine. Expected 'Standard'",
      code: 'INVALID_ENGINE',
    };
  }
  return {
    narrationStyle: options.narrationStyle,
    pronunciations: options.pronunciations,
    trimSilence: options.trimSilence,
    preset: qualityToPreset(options.quality),
    globalSpeed: `${Math.trunc((options.speed || 1) * 100)}%`,
  };
}

async function audioStreamFromSentences(
  sentencesStream: NodeJS.ReadableStream,
  writableStream: NodeJS.WritableStream,
  optionsInput: SpeechStreamOptions | undefined,
  reqConfig: PlayRequestConfig,
) {
  // Create a stream for promises
  const promiseStream = new Readable({
    objectMode: true,
    read() {},
  });

  function onError(error?: any) {
    let errorMessage = 'Error generating audio stream.';
    if (error != null) {
      const message = error.response?.data?.error_message || error.message;
      const code = error.code;
      const statusCode = error.response?.statusCode;
      const statusMessage = error.response?.statusMessage;

      errorMessage = `[PlayHT SDK] Error ${code || ''}`;
      if (statusCode || statusMessage) {
        errorMessage += ` - ${statusCode || ''} ${statusMessage || ''}`;
      }
      if (message) {
        errorMessage += ` - ${message}`;
      }
    }

    console.error(errorMessage);
    writableStream.emit('error', new Error(errorMessage));
    writableStream.end();
  }

  // For each sentence in the stream, add a task to the queue
  sentencesStream.on('data', async (data) => {
    const sentence = data.toString();
    const generatePromise = internalGenerateStreamFromString(sentence, optionsInput, reqConfig);
    promiseStream.push(generatePromise);
  });

  sentencesStream.on('end', async () => {
    promiseStream.push(null);
  });

  sentencesStream.on('error', onError);

  // Read from the promiseStream and await for each promise in order
  const writeAudio = new Writable({
    objectMode: true,
    write: async (generatePromise, _, callback) => {
      try {
        const resultStream = await generatePromise;
        if (!resultStream) {
          onError();
          return;
        }
        await new Promise<void>((resolve) => {
          resultStream.on('data', (chunk: Buffer) => {
            writableStream.write(chunk);
          });

          resultStream.on('end', () => {
            resolve();
          });

          resultStream.on('error', onError);
        });
        callback();
      } catch (error) {
        onError(error);
      }
    },
  });

  writeAudio.on('error', onError);

  promiseStream.on('error', onError);

  promiseStream.on('end', () => {
    setTimeout(
      () =>
        writeAudio.on('finish', () => {
          writableStream.end();
        }),
      0,
    );
  });

  promiseStream.pipe(writeAudio);
}

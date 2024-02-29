import type {
  SpeechOptions,
  SpeechStreamOptions,
  SpeechOutput,
  OutputQuality,
  Emotion,
  VoiceEngine,
  PlayHT10OutputStreamFormat,
  PlayHT20OutputStreamFormat,
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
import {CongestionCtrl} from "..";

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
  optionsInput?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  if (typeof input === 'string') {
    return await internalGenerateStreamFromString(input, optionsInput);
  } else {
    return await internalGenerateStreamFromInputStream(input, optionsInput);
  }
}

export async function internalGenerateStreamFromString(
  input: string,
  optionsInput?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  const options = addDefaultOptions(optionsInput);

  if (options.voiceEngine === 'Standard') {
    const v1Options = toV1Options(options);
    return await generateV1Stream(input, options.voiceId, v1Options);
  } else if (options.voiceEngine === 'PlayHT2.0' || options.voiceEngine === 'PlayHT2.0-turbo') {
    const v2Options = toV2Options(options, true);
    return await generateGRpcStream(input, options.voiceId, v2Options);
  } else {
    const v2Options = toV2Options(options, options.voiceEngine !== 'PlayHT1.0');
    return await generateV2Stream(input, options.voiceId, v2Options);
  }
}

export async function internalGenerateStreamFromInputStream(
  inputStream: NodeJS.ReadableStream,
  options?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  const sentencesStream = textStreamToSentences(inputStream);
  const passThrough = new PassThrough();
  audioStreamFromSentences(sentencesStream, passThrough, options);
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
  options?: SpeechStreamOptions,
) {
  // Create a stream of audio chunk promises -- each corresponding to a sentence
  const audioChunkStream = new Readable({
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

  let congestionController = new CongestionController(APISettingsStore.getSettings().congestionCtrl ?? CongestionCtrl.Off);

  // For each sentence in the stream, add a task to the queue
  let sentenceIdx = 0
  sentencesStream.on('data', async (data) => {
    const sentence = data.toString();

    /**
     * NOTE:
     *
     * If the congestion control algorithm is set to {@link CongestionCtrl.Off},
     * then this {@link CongestionController#enqueue} method will invoke the task immediately;
     * thereby generating the audio chunk for this sentence immediately.
     */
    congestionController.enqueue(() => {
      const nextAudioChunk = (async () => {
        return await internalGenerateStreamFromString(sentence, options);
      })();
      audioChunkStream.push(nextAudioChunk);
    }, `createAudioChunk#${sentenceIdx}`)

    sentenceIdx++
  });

  sentencesStream.on('end', async () => {

    /**
     * NOTE: if the congestion control algorithm is set to {@link CongestionCtrl.Off}, then this enqueue method will simply invoke the task immediately.
     */
    congestionController.enqueue(() => {
      audioChunkStream.push(null);
    }, "endAudioChunks")
  });

  sentencesStream.on('error', onError);

  // Await each audio chunk in order, and write the raw audio to the output audio stream
  const writeAudio = new Writable({
    objectMode: true,
    write: async (generatePromise, _, callback) => {
      try {
        const resultStream = await generatePromise;
        if (!resultStream) {
          onError();
          return;
        }
        let completion = {
          gotHeaders: false,
          gotAudio: false,
          gotEnd: false
        }
        await new Promise<void>((resolve) => {

          resultStream.on('data', (chunk: Buffer) => {
            if (completion.gotHeaders && !completion.gotAudio) {
              completion.gotAudio = true
              congestionController.audioRecvd();
            } else if (!completion.gotHeaders) {
              completion.gotHeaders = true
            }
            writableStream.write(chunk);
          });

          resultStream.on('end', () => {
            if(!completion.gotEnd) {
              completion.gotEnd = true
              congestionController.audioDone()
            }
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

  audioChunkStream.on('error', onError);

  audioChunkStream.on('end', () => {
    setTimeout(
      () =>
        writeAudio.on('finish', () => {
          writableStream.end();
        }),
      0,
    );
  });

  audioChunkStream.pipe(writeAudio);
}

class Task {
  fn: Function
  name: string

  constructor(fn: Function, name: string) {
    this.fn = fn;
    this.name = name
  }
}

/**
 * Responsible for optimizing the rate at which text is sent to the underlying API endpoint, according to the
 * specified {@link CongestionCtrl} algorithm.  {@link CongestionController} is essentially a task queue
 * that throttles the parallelism of, and delay between, task execution.
 *
 * The primary motivation for this (as of 2024/02/28) is to protect PlayHT On-Prem appliances
 * from being inundated with a burst text-to-speech requests that it can't satisfy.  Prior to the introduction
 * of {@link CongestionController} (and more generally {@link CongestionCtrl}), the client would split
 * a text stream into two text chunks (referred to as "sentences") and send them to the API client (i.e. gRPC client)
 * simultaneously.  This would routinely overload on-prem appliances that operate without a lot of GPU capacity headroom[1].
 *
 * The result would be that most requests that clients sent would immediately result in a gRPC error 8: RESOURCE_EXHAUSTED;
 * and therefore, a bad customer experience.  {@link CongestionController}, if configured with {@link CongestionCtrl#StaticMar2024},
 * will now delay sending subsequent text chunks (i.e. sentences) to the gRPC client until audio for the preceding text
 * chunk has started streaming.
 *
 * The current {@link CongestionCtrl} algorithm ({@link CongestionCtrl#StaticMar2024}) is very simple and leaves a lot to
 * be desired.  We should iterate on these algorithms.  The {@link CongestionCtrl} enum was added so that algorithms
 * can be added without requiring customers to change their code much.
 *
 * [1] Customers tend to be very cost sensitive regarding expensive GPU capacity, and therefore want to keep their appliances
 * running near 100% utilization.
 *
 * --mtp@2024/02/28
 *
 * This class is largely inert if the specified {@link CongestionCtrl} is {@link CongestionCtrl#Off}.
 */
class CongestionController {

  algo: CongestionCtrl;
  taskQ: Task[] = [];
  inflight: number = 0;
  parallelism: number;
  postChunkBackoff: number;

  constructor(algo: CongestionCtrl) {
    this.algo = algo;
    switch (algo) {
      case CongestionCtrl.Off:
        this.parallelism = Infinity;
        this.postChunkBackoff = 0;
        break;
      case CongestionCtrl.StaticMar2024:
        this.parallelism = 1;
        this.postChunkBackoff = 50;
        break;
      default:
        throw new Error(`Unrecognized congestion control algorithm: ${algo}`)
    }
  }

  enqueue(task: Function, name: string) {

    // if congestion control is turned off - just execute the task immediately
    if (this.algo == CongestionCtrl.Off) {
      task();
      return;
    }

    this.taskQ.push(new Task(task, name));
    this.maybeDoMore();
  }

  maybeDoMore() {

    // if congestion control is turned off - there's nothing to do here because all tasks were executed immediately
    if (this.algo == CongestionCtrl.Off) return

    for (; ;) {
      if (this.inflight >= this.parallelism) return
      if (this.taskQ.length == 0) return
      let task = this.taskQ.shift()!
      this.inflight++;
      task.fn();
    }
  }

  audioRecvd() {

    // if congestion control is turned off - there's nothing to do here because all tasks were executed immediately
    if (this.algo == CongestionCtrl.Off) return

    this.inflight = Math.max(this.inflight - 1, 0);
    setTimeout(() => {
      this.maybeDoMore();
    }, this.postChunkBackoff);
  }

  audioDone() {

    if (this.algo == CongestionCtrl.Off) return

    this.inflight = Math.max(this.inflight - 1, 0);
    this.maybeDoMore();
  }

}
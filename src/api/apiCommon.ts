import { OutputFormat, SpeechOptions, SpeechOutput , OutputQuality } from '..';
import APISettingsStore from './APISettingsStore';
import generateV1Speech from './generateV1Speech';
import generateV1Stream from './generateV1Stream';
import generateV2Speech from './generateV2Speech';
import generateV2Stream from './generateV2Stream';


export type V1ApiOptions = {
  narrationStyle?: string;
  globalSpeed?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
  preset?: Preset;
};

export type V2ApiOptions = {
  quality?: string;
  outputFormat?: OutputFormat;
  speed?: number;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
};

type Preset = 'real-time' | 'balanced' | 'low-latency' | 'high-quality';

type SpeechOptionsWithVoiceID = SpeechOptions & { voiceId: string };

export async function commonGenerateSpeech(input: string, optionsInput?: SpeechOptions): Promise<SpeechOutput> {
  const options = addDefaultOptions(optionsInput);

  if (options.voiceEngine === 'PlayHT1.0') {
    const v2Options = toV2Options(options);
    const result = await generateV2Speech(input, options.voiceId, v2Options);
    return {
      audioUrl: result.url,
      generationId: result.id,
    };
  } else if (options.voiceEngine === 'Standard') {
    const v1Options = toV1Options(options);
    const result = await generateV1Speech(input, options.voiceId, v1Options);
    return {
      audioUrl: result.audioUrl,
      generationId: result.transcriptionId,
      message: result.message,
    };
  }
  throw new Error('Invalid engine.');
}

export async function commonGenerateStream(
  input: string,
  outputStream: NodeJS.WritableStream,
  optionsInput?: SpeechOptions,
): Promise<void> {
  const options = addDefaultOptions(optionsInput);

  if (options.voiceEngine === 'PlayHT1.0') {
    const v2Options = toV2Options(options);
    return await generateV2Stream(input, options.voiceId, outputStream, v2Options);
  } else if (options.voiceEngine === 'Standard') {
    const v1Options = toV1Options(options);
    return await generateV1Stream(input, options.voiceId, outputStream, v1Options);
  }
  throw new Error('Invalid engine.');
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
  if (options.voiceEngine !== 'PlayHT1.0') {
    throw new Error('Invalid engine. Expected PlayHT1.0');
  }
  return {
    quality: options.quality,
    outputFormat: options.outputFormat,
    speed: options.speed,
    sampleRate: options.sampleRate,
    seed: options.seed,
    temperature: options.temperature,
  };
}

function toV1Options(options: SpeechOptionsWithVoiceID): V1ApiOptions {
  if (options.voiceEngine !== 'Standard') {
    throw new Error('Invalid engine. Expected PlayHT1.0');
  }
  return {
    narrationStyle: options.narrationStyle,
    pronunciations: options.pronunciations,
    trimSilence: options.trimSilence,
    preset: qualityToPreset(options.quality),
    globalSpeed: `${Math.trunc((options.speed || 1) * 100)  }%`,
  };
}

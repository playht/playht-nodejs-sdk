import { APISettingsStore } from './api/APISettingsStore';
import { commonGenerateSpeech, commonGenerateStream } from './api/apiCommon';
import { commonGetAllVoices } from './api/commonGetAllVoices';

export type VoiceEngine = 'Standard' | 'PlayHT1.0';
export type InputType = 'ssml' | 'plain';
export type OutputQuality = 'draft' | 'low' | 'medium' | 'high' | 'premium';
export type OutputFormat = 'mp3' | 'ogg' | 'wav' | 'flac' | 'mulaw';

export type VoiceInfo = {
  id: string;
  name: string;
  voiceEngine: VoiceEngine;
  sampleUrl?: string;
  language?: string;
  languageCode?: string;
  gender?: 'male' | 'female';
  accent?: string;
  ageGroup?: 'youth' | 'adult' | 'senior';
  styles?: Array<string>;
  isCloned: boolean;
};

export type SharedSpeechOptions = {
  voiceEngine: VoiceEngine;
  voiceId?: string;
  inputType?: InputType;
  speed?: number;
  quality?: OutputQuality;
};

export type StandardEngineOptions = {
  voiceEngine: 'Standard';
  narrationStyle?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
};

export type PlayHT10EngineOptions = {
  voiceEngine: 'PlayHT1.0';
  inputType?: 'plain';
  outputFormat?: OutputFormat;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
};

export type SpeechOptions =
  | (SharedSpeechOptions & PlayHT10EngineOptions)
  | (SharedSpeechOptions & StandardEngineOptions);

export type SpeechOutput = {
  audioUrl: string;
  generationId: string;
  message?: string;
};

export type APISettingsInput = {
  apiKey: string;
  userId: string;
  defaultVoiceId?: string;
  defaultVoiceEngine?: VoiceEngine;
};

export function init(settings: APISettingsInput) {
  APISettingsStore.setSettings(settings);
}

export async function generateSpeech(input: string, options?: SpeechOptions): Promise<SpeechOutput> {
  return await commonGenerateSpeech(input, options);
}

export async function streamSpeech(
  input: string,
  outputStream: NodeJS.WritableStream,
  options?: SpeechOptions,
): Promise<void> {
  return await commonGenerateStream(input, outputStream, options);
}

export type VoicesFilter = {
  voiceEngine?: Array<VoiceEngine>;
  isCloned?: boolean;
};

export async function listVoices(/* filters?: VoicesFilter */): Promise<Array<VoiceInfo>> {
  return await commonGetAllVoices(/*filters*/);
}

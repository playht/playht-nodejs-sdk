import availableV1Voices, { V1VoiceInfo } from './api/availableV1Voices';
import availableV2Voices, { V2VoiceInfo } from './api/availableV2Voices';
import availableClonedVoices from './api/availableClonedVoices';
import APISettingsStore from './api/APISettingsStore';
import { commonGenerateSpeech, commonGenerateStream } from './api/apiCommon';

export type VoiceEngine = 'Standard' | 'PlayHT1.0';
export type InputType = 'ssml' | 'plain';
export type OutputQuality = 'draft' | 'low' | 'medium' | 'high' | 'premium';
export type OutputFormat = 'mp3' | 'ogg' | 'wav' | 'flac' | 'mulaw';

export type VoiceInfo = V1VoiceInfo | V2VoiceInfo;

export type SharedSpeechOptions = {
  voiceEngine?: VoiceEngine;
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

export async function getAllVoices(filters?: VoicesFilter): Promise<Array<VoiceInfo>> {
  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    availableV1Voices(APISettingsStore.getSettings()),
    availableV2Voices(APISettingsStore.getSettings()),
    availableClonedVoices(APISettingsStore.getSettings()),
  ]);
  return [...v1Voices, ...v2Voices, ...clonedVoices];
}

import generateV2Speech, { V2SpeechResult } from './api/generateV2Speech';
import generateV2Stream from './api/generateV2Stream';
import generateV1Speech, { V1SpeechResult } from './api/generateV1Speech';
import generateV1Stream from './api/generateV1Stream';
import availableV1Voices, { V1VoiceInfo } from './api/availableV1Voices';
import availableV2Voices, { V2VoiceInfo } from './api/availableV2Voices';
import availableClonedVoices from './api/availableClonedVoices';

export type EngineType = 'Standard' | 'PlayHT1.0';

export type VoiceInfo = V1VoiceInfo | V2VoiceInfo;

export type v1ApiOptions = {
  title?: string;
  narrationStyle?: string;
  globalSpeed?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
  transcriptionId?: string;
};

export type v2ApiOptions = {
  quality?: string;
  outputFormat?: 'mp3' | 'ogg' | 'wav' | 'flac' | 'mulaw';
  speed?: number;
  sampleRate?: number;
  seed?: number | null;
  temperature?: number | null;
};

export function init(settings: { apiKey: string; userId: string }) {
  APISettingsStore.setSettings(settings);
}

export async function genereateStandardOrPremiumSpeech(
  content: Array<string>,
  voice: string,
  options?: v1ApiOptions,
): Promise<V1SpeechResult> {
  return await generateV1Speech(APISettingsStore.getSettings(), content, voice, options);
}

export async function genereateUltraRealisticSpeech(
  text: string,
  voice: string,
  options?: v2ApiOptions,
): Promise<V2SpeechResult> {
  return await generateV2Speech(APISettingsStore.getSettings(), text, voice, options);
}

export async function streamUltraRealisticSpeech(
  text: string,
  voice: string,
  outputStream: NodeJS.WritableStream,
  options?: v2ApiOptions,
): Promise<void> {
  return await generateV2Stream(APISettingsStore.getSettings(), text, voice, outputStream, options);
}

export async function streamStandardOrPremiumSpeech(
  content: Array<string>,
  voice: string,
  outputStream: NodeJS.WritableStream,
  options?: v1ApiOptions,
): Promise<void> {
  return await generateV1Stream(APISettingsStore.getSettings(), content, voice, outputStream, options);
}

export async function getUltraRealisticVoices(): Promise<Array<VoiceInfo>> {
  return await availableV2Voices(APISettingsStore.getSettings());
}

export async function getStandardOrPremiumVoices(): Promise<Array<VoiceInfo>> {
  return await availableV1Voices(APISettingsStore.getSettings());
}

export async function getClonedVoices(): Promise<Array<VoiceInfo>> {
  return await availableClonedVoices(APISettingsStore.getSettings());
}

export async function getAllVoices(): Promise<Array<VoiceInfo>> {
  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    availableV1Voices(APISettingsStore.getSettings()),
    availableV2Voices(APISettingsStore.getSettings()),
    availableClonedVoices(APISettingsStore.getSettings()),
  ]);
  return [...v1Voices, ...v2Voices, ...clonedVoices];
}

export type APISettings = {
  apiKey: string;
  userId: string;
};

export class APISettingsStore {
  apiKey: string;
  userId: string;

  private static _instance: APISettingsStore;

  private constructor(settings: APISettings) {
    this.apiKey = settings.apiKey;
    this.userId = settings.userId;

    if (APISettingsStore._instance) {
      return APISettingsStore._instance;
    }
    APISettingsStore._instance = this;
  }

  static getSettings(): APISettings {
    if (!APISettingsStore._instance) {
      throw new Error(
        'Initialise the API first by calling init() with your API key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    return {
      apiKey: APISettingsStore._instance.apiKey,
      userId: APISettingsStore._instance.userId,
    };
  }

  public static setSettings(settings: APISettings) {
    if (!settings.apiKey || !settings.userId) {
      throw new Error(
        'Please enter a valid api key and valid user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    new APISettingsStore(settings);
  }
}

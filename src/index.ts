import { generateV2Speech, V2SpeechResult } from './api/generateV2Speech';
import { generateV1Speech, V1SpeechResult } from './api/generateV1Speech';
import { availableV1Voices, VoiceInfo } from './api/availableV1Voices';

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

export default class PlayHTAPI {
  apiKey: string;
  userId: string;
  constructor(apiKey: string, userId: string) {
    if (!apiKey || !userId) {
      throw new Error(
        'Please enter a valid api key and valid user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    this.apiKey = apiKey;
    this.userId = userId;
  }

  async genereateStandardOrPremiumSpeech(
    content: Array<string>,
    voice: string,
    options?: v1ApiOptions,
  ): Promise<V1SpeechResult> {
    return await generateV1Speech(this.apiKey, this.userId, content, voice, options);
  }

  async genereateUltraRealisticSpeech(text: string, voice: string, options?: v2ApiOptions): Promise<V2SpeechResult> {
    return await generateV2Speech(this.apiKey, this.userId, text, voice, options);
  }

  async getAvailableStandardOrPremiumVoices(): Promise<Array<VoiceInfo>> {
    return await availableV1Voices(this.apiKey, this.userId);
  }
}

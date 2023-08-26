import { generateV2Speech, V2SpeechResult } from './api/generateV2Speech';
import { generateV2Stream } from './api/generateV2Stream';
import { generateV1Speech, V1SpeechResult } from './api/generateV1Speech';
import { V1VoiceInfo } from './api/availableV1Voices';
import { V2VoiceInfo } from './api/availableV2Voices';
import voicesPrivate from './private/voicesPrivate';

export type EngineType = 'Standard' | 'PlayHT1.0' | 'PlayHT2.0';

export type VoiceInfo =
  | ({
      engineType: 'Standard';
    } & V1VoiceInfo)
  | ({
      engineType: 'PlayHT1.0';
    } & V2VoiceInfo)
  | ({
      engineType: 'PlayHT2.0';
    } & V2VoiceInfo);

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

  _allVoicesCache: Array<VoiceInfo> | null = null;
  #getAllVoices: () => Promise<Array<VoiceInfo>>;

  constructor(apiKey: string, userId: string) {
    if (!apiKey || !userId) {
      throw new Error(
        'Please enter a valid api key and valid user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    this.apiKey = apiKey;
    this.userId = userId;

    this.#getAllVoices = voicesPrivate._getAllVoices;
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

  async streamUltraRealisticSpeech(
    text: string,
    voice: string,
    outputStream: NodeJS.WritableStream,
    options?: v2ApiOptions,
  ): Promise<void> {
    return await generateV2Stream(this.apiKey, this.userId, text, voice, outputStream, options);
  }

  async getAllAvailableVoices(): Promise<Array<VoiceInfo>> {
    return await this.#getAllVoices();
  }
}

import { generateV2Speech, v2SpeechResult } from './v2Api/v2tts';

export type v2ApiOptions = {
  quality?: string;
  outputFormat?: string; // TODO type
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

  async genereateStandardOrPremiumUltraRealisticSpeech() {
    // TODO use api/v1/convert endpoint
  }

  async genereateUltraRealisticSpeech(text: string, voice: string, options?: v2ApiOptions): Promise<v2SpeechResult> {
    return await generateV2Speech(this.apiKey, this.userId, text, voice, options);
  }

  async genereateSpeech() {
    // Choose API based on voice.
  }

  async getAvailableVoices() {
    // TODO api/v1/getVoices
  }
}

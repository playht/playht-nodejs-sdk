import type { APISettingsInput, VoiceEngine } from '..';
import { Client } from '../grpc-client/client';

const DEFAULT_VOICE_ID = 's3://peregrine-voices/larry_ads3_parrot_saad/manifest.json';
const DEFAULT_VOICE_ENGINE: VoiceEngine = 'PlayHT2.0';

type APISettings = APISettingsInput & { defaultVoiceId: string; defaultVoiceEngine: VoiceEngine };

export class APISettingsStore {
  settings: APISettings;
  gRpcClient: Client;

  private static _instance: APISettingsStore;

  private constructor(settings: APISettings) {
    this.settings = { ...settings };

    this.gRpcClient = new Client({
      userId: settings.userId,
      apiKey: settings.apiKey,
      customAddr: settings.customAddr,
      fallbackEnabled: settings.fallbackEnabled,
    });

    APISettingsStore._instance = this;
  }

  private static getInstance(): APISettingsStore {
    if (!APISettingsStore._instance) {
      throw new Error(
        'Initialise the PlayHT API first by calling init() with your API key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    return APISettingsStore._instance;
  }

  static getGRpcClient(): Client {
    return this.getInstance().gRpcClient;
  }

  static getSettings(): APISettings {
    return this.getInstance().settings;
  }

  public static setSettings(settings: APISettingsInput) {
    if (!settings.apiKey || !settings.userId) {
      throw new Error(
        'Please enter a valid api key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    new APISettingsStore({
      defaultVoiceEngine: DEFAULT_VOICE_ENGINE,
      defaultVoiceId: DEFAULT_VOICE_ID,
      fallbackEnabled: true,
      ...settings,
    });
  }
}

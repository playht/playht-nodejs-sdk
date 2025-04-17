import type { APISettingsInput, VoiceEngine } from '..';
import { Client } from '../grpc-client/client';
import { ExperimentalSettings } from './internal/config/ExperimentalSettings';

const DEFAULT_VOICE_ID = 's3://peregrine-voices/larry_ads3_parrot_saad/manifest.json';
const DEFAULT_VOICE_ENGINE: VoiceEngine = 'PlayHT2.0';

export type SDKSettings = APISettingsInput & {
  defaultVoiceId: string;
  defaultVoiceEngine: VoiceEngine;
  experimental?: ExperimentalSettings;
};

export class APISettingsStore {
  settings: SDKSettings;
  gRpcClient: Client;

  private static _instance: APISettingsStore;

  private constructor(settings: SDKSettings) {
    this.settings = { ...settings };

    this.gRpcClient = new Client({
      userId: settings.userId,
      apiKey: settings.apiKey,
      customAddr: settings.customAddr,
      fallbackEnabled: settings.fallbackEnabled,
      removeSsmlTags: settings.removeSsmlTags,
    });

    APISettingsStore._instance = this;
  }

  private static getInstance(): APISettingsStore {
    if (!APISettingsStore._instance) {
      throw new Error(
        'Initialize the PlayHT API first by calling init() with your API key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    return APISettingsStore._instance;
  }

  static getGRpcClient(): Client {
    return this.getInstance().gRpcClient;
  }

  static getSettings(): SDKSettings {
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
      fallbackEnabled: false,
      ...settings,
    });
  }
}

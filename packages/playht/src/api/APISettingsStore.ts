import type { APISettingsInput, VoiceEngine } from '..';

const DEFAULT_VOICE_ID = 's3://peregrine-voices/larry_ads3_parrot_saad/manifest.json';
const DEFAULT_VOICE_ENGINE: VoiceEngine = 'PlayHT2.0';

type APISettings = APISettingsInput & { defaultVoiceId: string; defaultVoiceEngine: VoiceEngine };

export class APISettingsStore {
  settings: APISettings;

  private static _instance: APISettingsStore;

  private constructor(settings: APISettings) {
    this.settings = { ...settings };

    APISettingsStore._instance = this;
  }

  static getSettings(): APISettings {
    if (!APISettingsStore._instance) {
      throw new Error(
        'Initialise the PlayHT API first by calling init() with your API key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
      );
    }
    return APISettingsStore._instance.settings;
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
      ...settings,
    });
  }
}

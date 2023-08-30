import { APISettingsInput, VoiceEngine } from '..';

const DEFAULT_VOICE_ID =
  's3://mockingbird-prod/larry_vo_narrative_4bd5c1bd-f662-4a38-b5b9-76563f7b92ec/voices/speaker/manifest.json';
const DEFAULT_VOICE_ENGINE: VoiceEngine = 'PlayHT1.0';

// type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type APISettings = APISettingsInput & { defaultVoiceId: string; defaultVoiceEngine: VoiceEngine };

export default class APISettingsStore {
  settings: APISettings;

  private static _instance: APISettingsStore;

  private constructor(settings: APISettings) {
    this.settings = { ...settings };

    APISettingsStore._instance = this;
  }

  static getSettings(): APISettings {
    if (!APISettingsStore._instance) {
      throw new Error(
        'Initialise the API first by calling init() with your API key and user ID. Please refer to https://docs.play.ht/reference/api-authentication for more info.',
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

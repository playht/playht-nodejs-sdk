import { SDKSettings } from '../../APISettingsStore';

export type PlayRequestConfigWithDefaults = {
  settings: SDKSettings;
  signal?: AbortSignal;
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type PlayRequestConfig = DeepPartial<PlayRequestConfigWithDefaults>;

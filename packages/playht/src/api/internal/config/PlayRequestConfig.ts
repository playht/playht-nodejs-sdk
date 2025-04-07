import { SDKSettings } from '../../APISettingsStore';

export type PlayRequestConfig = {
  settings: SDKSettings;
  signal?: AbortSignal;
};

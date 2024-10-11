import { SDKSettings } from '../../APISettingsStore';

export type PlayRequestConfig = {
  settings?: Partial<SDKSettings>;
  signal?: AbortSignal;
};

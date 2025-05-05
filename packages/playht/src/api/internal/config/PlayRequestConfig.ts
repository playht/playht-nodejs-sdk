import { SDKSettings } from '../../APISettingsStore';
import { DeepPartial } from '../utils/deepMergeMaintainingDefaults';

export type PlayRequestConfigWithDefaults = {
  settings: SDKSettings;
  signal?: AbortSignal;
};

export type PlayRequestConfig = DeepPartial<PlayRequestConfigWithDefaults>;

import { SDKSettings } from '../../APISettingsStore';

export function debugLog(sdkSettings: Partial<SDKSettings> | undefined, ...data: Array<any>) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  const logFunction = debug.log || console.log;
  logFunction(`[PlaySDK][${sdkSettings!.userId}]`, ...data);
}

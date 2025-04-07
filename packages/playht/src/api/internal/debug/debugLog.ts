import { SDKSettings } from '../../APISettingsStore';

export function debugLog(sdkSettings: Partial<SDKSettings> | undefined, message: string) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  const logFunction = debug.log || console.log;
  logFunction(`[PlaySDK][${sdkSettings!.userId}] ${message}`);
}

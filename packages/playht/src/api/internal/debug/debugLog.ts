import { SDKSettings } from '../../APISettingsStore';

export function debugLog(sdkSettings: Partial<SDKSettings> | undefined, ...data: Array<any>) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  const logFunction = debug.log || console.log;
  logFunction(`[PlaySDK][${sdkSettings!.userId}]`, ...data);
}

export function debugWarn(
  sdkSettings: Partial<SDKSettings> | undefined,
  warnMessage: string,
  logData: Parameters<NonNullable<NonNullable<SDKSettings['debug']>['warn']>>[1],
) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  if (debug.warn) {
    debug.warn(`[PlaySDK][${sdkSettings!.userId}] ${warnMessage}`, logData);
  } else {
    console.warn(`[PlaySDK][${sdkSettings!.userId}] ${warnMessage}`);
  }
}

export function debugError(
  sdkSettings: Partial<SDKSettings> | undefined,
  errorMessage: string,
  logData: Parameters<NonNullable<NonNullable<SDKSettings['debug']>['error']>>[1],
) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  if (debug.error) {
    debug.error(`[PlaySDK][${sdkSettings!.userId}] ${errorMessage}`, logData);
  } else {
    console.error(`[PlaySDK][${sdkSettings!.userId}] ${errorMessage}`);
  }
}

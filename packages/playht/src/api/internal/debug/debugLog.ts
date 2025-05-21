import { SDKSettings } from '../../APISettingsStore';

export function logInfo(
  sdkSettings: Partial<SDKSettings> | undefined,
  infoMessage: string,
  logData: Parameters<NonNullable<NonNullable<SDKSettings['debug']>['info']>>[1],
) {
  const debug = sdkSettings?.debug;
  if (!debug?.enabled) return;

  if (debug.info) {
    debug.info(`[PlaySDK][${sdkSettings!.userId}] ${infoMessage}`, logData);
  } else {
    console.info(`[PlaySDK][${sdkSettings!.userId}] ${infoMessage}`);
  }
}

export function logWarn(
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

export function logError(
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

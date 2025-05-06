import { SDKSettings } from '../../APISettingsStore';
import { extractErrorHeadersAndStatusIfTheyExist } from '../config/getAxiosClient';
import { debugInfo } from './debugLog';

export function logRequest(
  sdkSettings: Partial<SDKSettings> | undefined,
  event: Parameters<typeof debugInfo>[2]['event'],
  inferenceAddress: string,
  requestIdHeaderName: string,
  payloadForEngine: any,
  maybeHeadersStatusAndErrorMessage: unknown,
): void {
  const { headers, status, errorMessage } = extractErrorHeadersAndStatusIfTheyExist(maybeHeadersStatusAndErrorMessage);

  const inferenceBackend = inferenceAddress.replace(/.*\/(.*?)\/stream.*/, '$1');
  const requestId = headers[requestIdHeaderName];
  const ps = JSON.stringify(payloadForEngine);
  const em = errorMessage ? ` - Error: ${errorMessage}` : '';
  const msg = `Request - Inference Backend: ${inferenceBackend} - Params: ${ps} - Request-ID: ${requestId} - Status: ${status}${em}`;
  debugInfo(sdkSettings, msg, {
    event,
    inferenceBackend,
    requestId: requestId,
    backendPayload: payloadForEngine,
    responseStatus: status,
    ...(event === 'request-failed' ? { responseErrorMessage: errorMessage } : {}),
  });
}

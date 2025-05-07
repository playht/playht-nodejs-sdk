import { SDKSettings } from '../../APISettingsStore';
import { extractErrorHeadersAndStatusIfTheyExist } from '../config/getAxiosClient';
import { logError, logInfo } from './debugLog';

export function logRequest(
  sdkSettings: Partial<SDKSettings> | undefined,
  event: 'request-successful' | 'request-failed',
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

  const common = {
    inferenceBackend,
    requestId: requestId,
    backendPayload: payloadForEngine,
    responseStatus: status,
  };
  if (event === 'request-successful') {
    logInfo(sdkSettings, msg, { event, ...common });
  } else {
    logError(sdkSettings, msg, {
      event,
      ...common,
      responseErrorMessage: errorMessage,
      error: maybeHeadersStatusAndErrorMessage,
    });
  }
}

import type { PlayRequestConfigWithDefaults } from './PlayRequestConfig';
import type { APISettingsInput } from '../../../index';
import axios from 'axios';

export function getAxiosClient(
  reqConfig: PlayRequestConfigWithDefaults['settings'],
): NonNullable<NonNullable<APISettingsInput['advanced']>['axiosClient']> {
  return reqConfig.advanced?.axiosClient ?? axios;
}

export function extractErrorHeadersAndStatusIfTheyExist(error: unknown) {
  return {
    headers: extractFromErrorResponse<Record<string, any>>(error, 'headers', {}),
    status: extractFromErrorResponse(error, 'status', -1),
  };
}

function extractFromErrorResponse<T>(error: any, fieldName: string, defaultValue: T) {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    fieldName in error.response
  )
    return error.response[fieldName] as T;
  return defaultValue;
}

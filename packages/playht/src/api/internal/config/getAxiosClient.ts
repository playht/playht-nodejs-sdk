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
    errorMessage: extractMessageFromError(error),
    headers: extractFromObjOrErrorResponseObj<Record<string, any>>(error, 'headers') ?? {},
    status: extractFromObjOrErrorResponseObj<number>(error, 'status') ?? ('<NONE>' as const),
  };
}

function extractMessageFromError(error: any) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.response === 'string')
    return error.message;
  return undefined;
}

/**
 * Tries to extract the value of a field called fieldName from an object.
 *
 * We try to get either obj.response.fieldName or obj.fieldName.
 *
 * This is typically used to extract the value of a field from an axios error response object, where
 * the status code is on axiosError.response.status.
 *
 * @param maybeObj The object to extract the field from, potentially an axios error response
 * @param fieldName The name of the field to extract from the object
 */
function extractFromObjOrErrorResponseObj<T>(maybeObj: unknown, fieldName: string): T | null {
  if (!maybeObj || typeof maybeObj !== 'object') {
    return null;
  }
  const obj = maybeObj as Record<string, any>;
  // try to get obj.response.fieldName
  if ('response' in obj && obj.response && typeof obj.response === 'object' && fieldName in obj.response)
    return obj.response[fieldName] as T;
  // try to get obj.fieldName
  if (fieldName in obj) return obj[fieldName] as T;
  return null;
}

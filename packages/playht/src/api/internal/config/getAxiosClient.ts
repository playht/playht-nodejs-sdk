import type { PlayRequestConfigWithDefaults } from './PlayRequestConfig';
import type { APISettingsInput } from '../../../index';
import axios from 'axios';

export function getAxiosClient(
  reqConfig: PlayRequestConfigWithDefaults['settings'],
): NonNullable<NonNullable<APISettingsInput['advanced']>['axiosClient']> {
  return reqConfig.advanced?.axiosClient ?? axios;
}

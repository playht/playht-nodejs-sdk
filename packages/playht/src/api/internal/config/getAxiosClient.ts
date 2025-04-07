import type { PlayRequestConfig } from './PlayRequestConfig';
import axios from 'axios';

export function getAxiosClient(reqConfig: PlayRequestConfig['settings']): typeof axios {
  return reqConfig.advanced?.axiosClient ?? axios;
}

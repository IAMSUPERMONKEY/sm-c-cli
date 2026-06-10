import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT_MS, CLI_NAME, PKG_VERSION } from '../../config.js';
import { getClientId } from '../client-id.js';

let cached: AxiosInstance | undefined;

export function getHttpClient(): AxiosInstance {
  if (cached) return cached;
  cached = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      'User-Agent': `${CLI_NAME}/${PKG_VERSION}`,
      'client-id': getClientId(),
      Accept: 'application/json',
    },
  });
  return cached;
}

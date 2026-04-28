import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT_MS, PKG_NAME, PKG_VERSION } from '../../config.js';

let cached: AxiosInstance | undefined;

export function getHttpClient(): AxiosInstance {
  if (cached) return cached;
  cached = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      'User-Agent': `${PKG_NAME}/${PKG_VERSION}`,
      Accept: 'application/json',
    },
  });
  return cached;
}

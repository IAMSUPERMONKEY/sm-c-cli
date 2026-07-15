import {
  clearAuthToken,
  getConfigDir,
  saveAuthToken,
} from '@/shared/auth-storage.js';
import type { LoginInput, LoginResult } from './schema.js';

export { getConfigDir } from '@/shared/auth-storage.js';

export function login(input: LoginInput, configDir = getConfigDir()): LoginResult {
  return { credentialPath: saveAuthToken(input.token, configDir) };
}

export function logout(configDir = getConfigDir()): void {
  clearAuthToken(configDir);
}

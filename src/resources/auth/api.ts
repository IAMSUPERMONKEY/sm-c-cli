import {
  clearAuthToken,
  getConfigDir,
  saveAuthToken,
} from '@/shared/auth-storage.js';
import { getHttpClient } from '@/shared/http/client.js';
import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import {
  WhoAmIEnvelope,
  WhoAmIResult,
  type LoginInput,
  type LoginResult,
} from './schema.js';

export { getConfigDir } from '@/shared/auth-storage.js';

export function login(input: LoginInput, configDir = getConfigDir()): LoginResult {
  return { credentialPath: saveAuthToken(input.token, configDir) };
}

export function logout(configDir = getConfigDir()): void {
  clearAuthToken(configDir);
}

export async function getWhoAmI(): Promise<WhoAmIResult> {
  const client = getHttpClient();
  const res = await client.get(API_PATHS.authWhoAmI);
  const env = WhoAmIEnvelope.parse(res.data);

  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  return WhoAmIResult.parse(env.data);
}

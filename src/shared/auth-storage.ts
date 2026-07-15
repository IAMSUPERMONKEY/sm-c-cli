import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CLI_NAME } from '../config.js';
import { CliError } from './errors.js';

const CREDENTIALS_FILE = 'credentials.json';

export const AUTH_LOGIN_GUIDANCE =
  '请在超级猩猩 App 中开启 CLI 访问授权：进入“我的”→ 点击右上角“设置”→ 选择“超级猩猩 API Key”；获取令牌后，运行 sm-c-cli auth login --token <令牌> 完成配置。';

export function getConfigDir(): string {
  return join(homedir(), '.config', CLI_NAME);
}

export function getCredentialPath(configDir = getConfigDir()): string {
  return join(configDir, CREDENTIALS_FILE);
}

export function saveAuthToken(token: string, configDir = getConfigDir()): string {
  mkdirSync(configDir, { recursive: true, mode: 0o700 });
  chmodSync(configDir, 0o700);

  const credentialPath = getCredentialPath(configDir);
  writeFileSync(credentialPath, `${JSON.stringify({ token }, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  chmodSync(credentialPath, 0o600);

  return credentialPath;
}

export function getAuthToken(configDir = getConfigDir()): string | undefined {
  const credentialPath = getCredentialPath(configDir);
  if (!existsSync(credentialPath)) return undefined;

  try {
    const credentials = JSON.parse(readFileSync(credentialPath, 'utf8')) as unknown;
    if (!credentials || typeof credentials !== 'object' || !('token' in credentials)) {
      return undefined;
    }

    const token = (credentials as { token?: unknown }).token;
    if (typeof token !== 'string') return undefined;

    return token.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function requireAuthToken(configDir = getConfigDir()): string {
  const token = getAuthToken(configDir);
  if (!token) throw new CliError(40101, AUTH_LOGIN_GUIDANCE);
  return token;
}

export function clearAuthToken(configDir = getConfigDir()): void {
  const credentialPath = getCredentialPath(configDir);
  if (existsSync(credentialPath)) unlinkSync(credentialPath);
}

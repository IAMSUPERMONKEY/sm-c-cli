import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CLI_NAME } from '@/config.js';
import type { LoginInput, LoginResult } from './schema.js';

const CREDENTIALS_FILE = 'credentials.json';

export function getConfigDir(): string {
  return join(homedir(), '.config', CLI_NAME);
}

export function login(input: LoginInput, configDir = getConfigDir()): LoginResult {
  mkdirSync(configDir, { recursive: true, mode: 0o700 });
  chmodSync(configDir, 0o700);

  const credentialPath = join(configDir, CREDENTIALS_FILE);
  writeFileSync(credentialPath, `${JSON.stringify({ token: input.token }, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  chmodSync(credentialPath, 0o600);

  return { credentialPath };
}

export function logout(configDir = getConfigDir()): void {
  const credentialPath = join(configDir, CREDENTIALS_FILE);
  if (existsSync(credentialPath)) unlinkSync(credentialPath);
}

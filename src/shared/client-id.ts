import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { CLI_NAME } from '../config.js';

const CLIENT_ID_NAMESPACE = 'sm-c-cli:client-id:v1\0';
const FALLBACK_NAMESPACE = 'sm-c-cli:client-id:fallback:v1';
const INSTALL_SECRET_FILE = 'client-id-secret';
const INSTALL_SECRET_LENGTH = 32;
const SECRET_READ_RETRIES = 5;
const SECRET_READ_RETRY_DELAY_MS = 10;
const INVALID_SECRET_MESSAGE = 'Client ID 安装密钥文件无效';

export interface ClientIdDependencies {
  ensureDirectory(directory: string): void;
  randomBytes(size: number): Buffer;
  readTextFile(file: string): string;
  runCommand(command: string, args: string[]): string;
  sleep(milliseconds: number): void;
  writeTextFileExclusive(file: string, contents: string): void;
}

interface ClientIdGetterOptions {
  configDir?: string;
  getInstallSecret?: (secretFile: string) => Buffer;
  getMachineId?: () => string | undefined;
}

const defaultDependencies: ClientIdDependencies = {
  ensureDirectory(directory) {
    mkdirSync(directory, { recursive: true });
  },
  randomBytes,
  readTextFile(file) {
    return readFileSync(file, 'utf8');
  },
  runCommand(command, args) {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  },
  sleep(milliseconds) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  },
  writeTextFileExclusive(file, contents) {
    writeFileSync(file, contents, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  },
};

function dependenciesWith(overrides: Partial<ClientIdDependencies> = {}): ClientIdDependencies {
  return { ...defaultDependencies, ...overrides };
}

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}

function assertSecretLength(secret: Buffer): void {
  if (secret.length !== INSTALL_SECRET_LENGTH) {
    throw new Error(INVALID_SECRET_MESSAGE);
  }
}

function parseInstallSecret(contents: string): Buffer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error(INVALID_SECRET_MESSAGE);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    parsed.version !== 1 ||
    !('secret' in parsed) ||
    typeof parsed.secret !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(parsed.secret)
  ) {
    throw new Error(INVALID_SECRET_MESSAGE);
  }

  const secret = Buffer.from(parsed.secret, 'base64url');
  assertSecretLength(secret);
  if (secret.toString('base64url') !== parsed.secret) {
    throw new Error(INVALID_SECRET_MESSAGE);
  }
  return secret;
}

function serializeInstallSecret(secret: Buffer): string {
  assertSecretLength(secret);
  return `${JSON.stringify({ version: 1, secret: secret.toString('base64url') })}\n`;
}

function readSecretWithRetries(
  secretFile: string,
  dependencies: ClientIdDependencies,
  initialError?: unknown,
): Buffer {
  let lastError = initialError;
  for (let attempt = 0; attempt < SECRET_READ_RETRIES; attempt += 1) {
    if (lastError !== undefined) {
      dependencies.sleep(SECRET_READ_RETRY_DELAY_MS);
    }
    try {
      return parseInstallSecret(dependencies.readTextFile(secretFile));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function normalizeMachineId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function deriveClientId(machineId: string, installSecret: Buffer): string {
  assertSecretLength(installSecret);
  const digest = createHmac('sha256', installSecret)
    .update(CLIENT_ID_NAMESPACE, 'utf8')
    .update(normalizeMachineId(machineId), 'utf8')
    .digest('base64url');
  return `v1.${digest}`;
}

export function deriveFallbackClientId(installSecret: Buffer): string {
  assertSecretLength(installSecret);
  const digest = createHmac('sha256', installSecret)
    .update(FALLBACK_NAMESPACE, 'utf8')
    .digest('base64url');
  return `v1r.${digest}`;
}

export function readMachineId(
  platform: NodeJS.Platform,
  overrides: Partial<ClientIdDependencies> = {},
): string | undefined {
  const dependencies = dependenciesWith(overrides);
  try {
    if (platform === 'linux') {
      for (const file of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
        try {
          const machineId = normalizeMachineId(dependencies.readTextFile(file));
          if (machineId) return machineId;
        } catch {
          // Continue to the next operating-system-provided machine ID file.
        }
      }
      return undefined;
    }

    if (platform === 'darwin') {
      const output = dependencies.runCommand('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice']);
      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      return match?.[1] ? normalizeMachineId(match[1]) || undefined : undefined;
    }

    if (platform === 'win32') {
      const output = dependencies.runCommand('reg', [
        'query',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography',
        '/v',
        'MachineGuid',
      ]);
      const match = output.match(/MachineGuid\s+REG_\w+\s+([^\r\n]+)/i);
      return match?.[1] ? normalizeMachineId(match[1]) || undefined : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function readOrCreateInstallSecret(
  secretFile: string,
  overrides: Partial<ClientIdDependencies> = {},
): Buffer {
  const dependencies = dependenciesWith(overrides);
  dependencies.ensureDirectory(dirname(secretFile));

  try {
    const contents = dependencies.readTextFile(secretFile);
    try {
      return parseInstallSecret(contents);
    } catch (error) {
      return readSecretWithRetries(secretFile, dependencies, error);
    }
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error;
  }

  const secret = dependencies.randomBytes(INSTALL_SECRET_LENGTH);
  const contents = serializeInstallSecret(secret);
  try {
    dependencies.writeTextFileExclusive(secretFile, contents);
    return secret;
  } catch (error) {
    if (!isNodeError(error, 'EEXIST')) throw error;
    return readSecretWithRetries(secretFile, dependencies);
  }
}

export function createClientIdGetter(options: ClientIdGetterOptions = {}): () => string {
  const configDir = options.configDir ?? join(homedir(), '.config', CLI_NAME);
  const getInstallSecret = options.getInstallSecret ?? readOrCreateInstallSecret;
  const getMachineId = options.getMachineId ?? (() => readMachineId(process.platform));
  let cachedClientId: string | undefined;

  return () => {
    if (cachedClientId !== undefined) return cachedClientId;
    const secret = getInstallSecret(join(configDir, INSTALL_SECRET_FILE));
    const machineId = normalizeMachineId(getMachineId() ?? '');
    cachedClientId = machineId ? deriveClientId(machineId, secret) : deriveFallbackClientId(secret);
    return cachedClientId;
  };
}

export const getClientId = createClientIdGetter();

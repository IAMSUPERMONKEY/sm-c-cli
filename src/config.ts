import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8')) as {
  name: string;
  version: string;
};

export const CLI_NAME = 'sm-c-cli';

export const PKG_VERSION = pkg.version;

export const API_BASE_URL =
  process.env.SM_C_CLI_API_BASE_URL ?? 'https://ai-cli.supermonkey.com.cn';

export const DEFAULT_TIMEOUT_MS = 10_000;

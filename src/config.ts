import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8')) as {
  name: string;
  version: string;
};

export const PKG_NAME = pkg.name;
export const PKG_VERSION = pkg.version;

const isUseMock = true;

export const API_BASE_URL = isUseMock
  ? 'https://m1.apifoxmock.com/m1/8184807-7944062-default'
  : (process.env.SM_C_CLI_API_BASE_URL ?? 'https://ai-cli.supermonkey.cc');

export const DEFAULT_TIMEOUT_MS = 10_000;

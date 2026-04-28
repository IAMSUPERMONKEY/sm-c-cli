import type { Envelope } from './envelope.js';
import { colorizeJson } from './json-color.js';

export const FORMATS = ['json', 'ndjson', 'table', 'pretty'] as const;
export type Format = (typeof FORMATS)[number];

export function parseFormat(value: string): Format {
  if ((FORMATS as readonly string[]).includes(value)) {
    return value as Format;
  }
  throw new Error(`invalid format: ${value} (expected one of ${FORMATS.join(', ')})`);
}

export type TableRenderer<T> = (data: T) => string;

export type WriteOptions<T> = {
  table?: TableRenderer<T>;
};

export function writeEnvelope<T>(
  env: Envelope<T>,
  format: Format,
  options: WriteOptions<T> = {},
): void {
  switch (format) {
    case 'json':
      process.stdout.write(`${JSON.stringify(env)}\n`);
      return;

    case 'pretty':
      process.stdout.write(`${colorizeJson(env)}\n`);
      return;

    case 'ndjson':
      if (env.code === 0 && isListData(env.data)) {
        for (const item of env.data.list) {
          process.stdout.write(`${JSON.stringify(item)}\n`);
        }
        return;
      }
      process.stdout.write(`${JSON.stringify(env)}\n`);
      return;

    case 'table':
      if (env.code === 0 && options.table) {
        process.stdout.write(`${options.table(env.data as T)}\n`);
      } else {
        process.stdout.write(`${env.msg}\n`);
      }
      return;
  }
}

function isListData(data: unknown): data is { list: unknown[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as { list?: unknown }).list)
  );
}

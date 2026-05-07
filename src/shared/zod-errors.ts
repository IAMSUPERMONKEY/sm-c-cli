import type { z } from 'zod';

export function formatZodError(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return 'invalid argument';

  const message = issue.message;
  if (message.startsWith('--')) return message;

  const key = issue.path[0];
  if (key === undefined || key === null) return message;
  return `${toFlag(String(key))}, ${message}`;
}

function toFlag(key: string): string {
  const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return `--${kebab}`;
}

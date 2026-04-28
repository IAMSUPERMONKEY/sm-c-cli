export const EXIT = {
  OK: 0,
  GENERIC: 1,
  INVALID_ARG: 2,
  UPSTREAM: 3,
  AUTH: 4,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export function exitCodeOf(code: number): ExitCode {
  if (code === 0) return EXIT.OK;
  if (code >= 40100 && code < 40200) return EXIT.AUTH;
  if (code >= 40000 && code < 50000) return EXIT.INVALID_ARG;
  if (code >= 30000 && code < 40000) return EXIT.UPSTREAM;
  return EXIT.GENERIC;
}

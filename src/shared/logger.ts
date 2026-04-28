let verbose = false;

export function setVerbose(v: boolean): void {
  verbose = v;
}

export function debug(...args: unknown[]): void {
  if (!verbose) return;
  process.stderr.write(`[debug] ${args.map(stringify).join(' ')}\n`);
}

export function warn(...args: unknown[]): void {
  process.stderr.write(`[warn] ${args.map(stringify).join(' ')}\n`);
}

function stringify(v: unknown): string {
  return typeof v === 'string' ? v : JSON.stringify(v);
}

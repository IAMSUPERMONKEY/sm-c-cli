import { AxiosError } from 'axios';
import { CliError } from '../errors.js';

export function toCliError(err: unknown): CliError {
  if (err instanceof CliError) return err;
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const msg = status
      ? `upstream error: HTTP ${status}`
      : `upstream error: ${err.code ?? err.message}`;
    return new CliError(30000, msg);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return new CliError(1, msg);
}

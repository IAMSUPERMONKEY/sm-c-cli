import type { Command } from 'commander';
import { AxiosError } from 'axios';
import { AUTH_LOGIN_GUIDANCE, getConfigDir, requireAuthToken } from '@/shared/auth-storage.js';
import { ok, fail } from '@/shared/envelope.js';
import { CliError } from '@/shared/errors.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { setVerbose } from '@/shared/logger.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';
import { getWhoAmI } from './api.js';
import type { WhoAmIResult } from './schema.js';

type WhoAmIRequest = () => Promise<WhoAmIResult>;

function rootOf(cmd: Command): Command {
  let curr = cmd;
  while (curr.parent) curr = curr.parent;
  return curr;
}

export async function loadWhoAmI(
  configDir = getConfigDir(),
  request: WhoAmIRequest = getWhoAmI,
): Promise<WhoAmIResult> {
  requireAuthToken(configDir);
  try {
    return await request();
  } catch (err) {
    const cliErr = toCliError(err);
    const isHttpUnauthorized = err instanceof AxiosError && err.response?.status === 401;
    if (cliErr.code === 401 || isHttpUnauthorized) {
      throw new CliError(401, `授权令牌无效。${AUTH_LOGIN_GUIDANCE}`);
    }
    throw cliErr;
  }
}

export function registerWhoAmI(parent: Command): void {
  parent
    .command('+whoami')
    .description('查看当前用户身份和授权信息')
    .action(async (_opts: Record<string, never>, cmd: Command) => {
      const root = rootOf(cmd);
      const rawFormat = (root.opts().format as string | undefined) ?? 'json';
      setVerbose(Boolean(root.opts().verbose));

      let format: Format = 'json';
      try {
        format = parseFormat(rawFormat);
      } catch (err) {
        const cliErr = new CliError(40002, (err as Error).message);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, 'json');
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }

      try {
        const env = ok(await loadWhoAmI());
        writeEnvelope(env, format);
        process.exit(exitCodeOf(env.code));
      } catch (err) {
        const cliErr = toCliError(err);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, format);
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }
    });
}

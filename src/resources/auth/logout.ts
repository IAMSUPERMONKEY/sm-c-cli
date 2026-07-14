import type { Command } from 'commander';
import { logout } from './api.js';
import { ok, fail } from '@/shared/envelope.js';
import { CliError } from '@/shared/errors.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';

function rootOf(cmd: Command): Command {
  let curr = cmd;
  while (curr.parent) curr = curr.parent;
  return curr;
}

export function registerLogout(parent: Command): void {
  parent
    .command('logout')
    .description('退出登录并删除本地凭证')
    .action((_opts: Record<string, never>, cmd: Command) => {
      const root = rootOf(cmd);
      const rawFormat = (root.opts().format as string | undefined) ?? 'json';

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
        logout();
        const env = ok({});
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

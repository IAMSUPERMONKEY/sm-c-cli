import type { Command } from 'commander';
import { z } from 'zod';

import { PKG_VERSION } from '@/config.js';
import { ok, fail } from '@/shared/envelope.js';
import { CliError } from '@/shared/errors.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';
import { formatZodError } from '@/shared/zod-errors.js';
import { NodeCommandRunner, type CommandRunner } from './command-runner.js';
import { DEFAULT_NPM_REGISTRY, UpdateService } from './update-service.js';

export { DEFAULT_NPM_REGISTRY } from './update-service.js';

const UpdateInput = z.object({
  registry: z
    .url('必须是有效的 URL')
    .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
      message: '必须使用 http 或 https 协议',
    })
    .describe('npm registry 地址'),
});

interface UpdateOptions {
  registry: string;
}

function rootOf(cmd: Command): Command {
  let curr = cmd;
  while (curr.parent) curr = curr.parent;
  return curr;
}

export function registerUpdate(
  program: Command,
  runner: CommandRunner = new NodeCommandRunner(),
  cliVersion: string = PKG_VERSION,
): void {
  program
    .command('update')
    .description('升级 sm-c-cli 并同步全局 Skills')
    .option('--registry <url>', '指定 npm registry 地址', DEFAULT_NPM_REGISTRY)
    .action(async (opts: UpdateOptions, cmd: Command) => {
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
        const input = UpdateInput.parse(opts);
        const service = new UpdateService(runner, cliVersion, input.registry, (message) => {
          process.stderr.write(`${message}\n`);
        });
        const env = ok(await service.update());
        writeEnvelope(env, format);
        process.exit(exitCodeOf(env.code));
      } catch (err) {
        const cliErr =
          err instanceof z.ZodError ? new CliError(40001, formatZodError(err)) : toCliError(err);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, format);
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }
    });
}

import type { Command } from 'commander';
import { z } from 'zod';
import { OrderInput, type OrderResult } from './schema.js';
import { getClassScheduleOrderCode } from './api.js';
import { ok, fail } from '@/shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '@/shared/output.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { setVerbose, debug } from '@/shared/logger.js';
import { CliError } from '@/shared/errors.js';
import { toCliError } from '@/shared/http/errors.js';
import { formatZodError } from '@/shared/zod-errors.js';

export function registerOrder(parent: Command): void {
  parent
    .command('+order')
    .description('根据课表 id 获取该课表的预约链接地址')
    .requiredOption('--schedule-id <scheduleId>', '课表 id（对应 +search 返回的 scheduleId）')
    .requiredOption(
      '--schedule-id-sk <scheduleIdSk>',
      '课表 id 验证（对应 +search 返回的 scheduleIdSk）',
    )
    .action(async (opts: Record<string, unknown>, cmd: Command) => {
      const root = cmd.parent?.parent;
      const rawFormat = (root?.opts().format as string | undefined) ?? 'json';
      setVerbose(Boolean(root?.opts().verbose));

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
        const input = OrderInput.parse({
          scheduleId: opts.scheduleId,
          scheduleIdSk: opts.scheduleIdSk,
        });
        debug('input', input);
        const data = await getClassScheduleOrderCode(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: OrderResult) => d.codeUrl,
        });
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

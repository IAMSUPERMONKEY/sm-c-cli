import type { Command } from 'commander';
import { z } from 'zod';
import { getPersonalTrainingDetail } from './api.js';
import { PersonalDetailInput } from './schema.js';
import { CliError } from '@/shared/errors.js';
import { ok, fail } from '@/shared/envelope.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { debug, setVerbose } from '@/shared/logger.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';
import { formatZodError } from '@/shared/zod-errors.js';

export function registerPersonalDetail(parent: Command): void {
  parent
    .command('+personal-detail')
    .description('获取私教训练详情')
    .requiredOption('--order-type <orderType>', '私教订单类型')
    .requiredOption('--training-id <trainingId>', '训练 ID，必须大于 0')
    .option('--order-id <orderId>', '订单 ID，必须是正整数字符串')
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
        const input = PersonalDetailInput.parse({
          orderType: opts.orderType,
          trainingId: opts.trainingId,
          orderId: opts.orderId,
        });
        debug('input', input);
        const env = ok(await getPersonalTrainingDetail(input));
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

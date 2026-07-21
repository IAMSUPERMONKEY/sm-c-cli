import type { Command } from 'commander';
import { z } from 'zod';
import { listTrainingRecords } from './api.js';
import {
  ListInput,
  type ApiListResult,
  type ApiTrainingRecord,
  type ListResult,
} from './schema.js';
import { renderTrainingRecordsTable } from './table.js';
import { CliError } from '@/shared/errors.js';
import { ok, fail } from '@/shared/envelope.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { debug, setVerbose } from '@/shared/logger.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';
import { formatZodError } from '@/shared/zod-errors.js';

const TRAINING_TYPE_LABELS: Record<ApiTrainingRecord['trainingType'], string> = {
  1: '团体课',
  2: '训练营',
  3: '私教',
  4: '甄选商品',
  5: 'SGO',
};

const CHECKIN_LABELS: Record<ApiTrainingRecord['checkin'], string> = {
  0: '未签到',
  1: '已签到',
};

export function mapTrainingRecordLabels(data: ApiListResult): ListResult {
  return {
    list: data.list.map((record) => ({
      ...record,
      checkin: CHECKIN_LABELS[record.checkin],
      trainingType: TRAINING_TYPE_LABELS[record.trainingType],
    })),
  };
}

export function registerList(parent: Command): void {
  parent
    .command('+list')
    .description('按月份获取运动记录列表')
    .requiredOption('--year-month <yearMonth>', '查询年月，格式 YYYY-MM')
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
        const input = ListInput.parse({ yearMonth: opts.yearMonth });
        debug('input', input);
        const data = mapTrainingRecordLabels(await listTrainingRecords(input));
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (result: ListResult) => renderTrainingRecordsTable(result.list),
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

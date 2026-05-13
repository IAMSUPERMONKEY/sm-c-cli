import type { Command } from 'commander';
import { z } from 'zod';
import {
  SearchByKeywordInput,
  type SearchByKeywordResult,
} from './schema.js';
import { searchBoxesByKeyword } from './api.js';
import { renderBoxesByKeywordTable } from './table.js';
import { ok, fail } from '@/shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '@/shared/output.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { setVerbose, debug } from '@/shared/logger.js';
import { CliError } from '@/shared/errors.js';
import { toCliError } from '@/shared/http/errors.js';
import { formatZodError } from '@/shared/zod-errors.js';

export function registerSearchByKeyword(parent: Command): void {
  parent
    .command('+search')
    .description('按关键字搜索门店（支持城市 / 区域 / 地址，如「深圳 单车」「深圳」）')
    .requiredOption('--keyword <keyword>', '关键字')
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
        const input = SearchByKeywordInput.parse({ keyword: opts.keyword });
        debug('input', input);
        const data = await searchBoxesByKeyword(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: SearchByKeywordResult) =>
            renderBoxesByKeywordTable(d.list),
        });
        process.exit(exitCodeOf(env.code));
      } catch (err) {
        const cliErr =
          err instanceof z.ZodError
            ? new CliError(40001, formatZodError(err))
            : toCliError(err);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, format);
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }
    });
}

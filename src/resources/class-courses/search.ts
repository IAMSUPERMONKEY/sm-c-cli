import type { Command } from 'commander';
import { z } from 'zod';
import { SearchInput, type SearchResult } from './schema.js';
import { searchClassCourses } from './api.js';
import { renderClassCoursesTable } from './table.js';
import { ok, fail } from '@/shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '@/shared/output.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { setVerbose, debug } from '@/shared/logger.js';
import { CliError } from '@/shared/errors.js';
import { toCliError } from '@/shared/http/errors.js';
import { formatZodError } from '@/shared/zod-errors.js';

export function registerSearch(parent: Command): void {
  parent
    .command('+search')
    .description('按关键词搜索团课课程（如「莱美」「单车」）')
    .requiredOption('--keyword <keyword>', '查询关键词')
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
        const input = SearchInput.parse({ keyword: opts.keyword });
        debug('input', input);
        const data = await searchClassCourses(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: SearchResult) => renderClassCoursesTable(d.list),
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

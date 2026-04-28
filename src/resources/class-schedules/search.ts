import type { Command } from 'commander';
import { z } from 'zod';
import { SearchInput, type SearchResult } from './schema.js';
import { searchClassSchedules } from './api.js';
import { renderClassSchedulesTable } from './table.js';
import { ok, fail } from '../../shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '../../shared/output.js';
import { exitCodeOf } from '../../shared/exit-codes.js';
import { setVerbose, debug } from '../../shared/logger.js';
import { CliError } from '../../shared/errors.js';
import { toCliError } from '../../shared/http/errors.js';

export function registerSearch(parent: Command): void {
  parent
    .command('+search')
    .description('Search class schedules by city, keyword and optional date')
    .requiredOption('--city <city>', 'city name')
    .requiredOption('--keyword <keyword>', 'store / class / trainer keyword')
    .option('--date <date>', 'date, YYYY-MM-DD')
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
        const input = SearchInput.parse({
          city: opts.city,
          keyword: opts.keyword,
          date: opts.date,
        });
        debug('input', input);
        const data = await searchClassSchedules(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: SearchResult) => renderClassSchedulesTable(d.list),
        });
        process.exit(exitCodeOf(env.code));
      } catch (err) {
        const cliErr =
          err instanceof z.ZodError
            ? new CliError(40001, err.issues[0]?.message ?? 'invalid argument')
            : toCliError(err);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, format);
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }
    });
}

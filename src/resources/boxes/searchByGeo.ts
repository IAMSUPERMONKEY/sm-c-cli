import type { Command } from 'commander';
import { z } from 'zod';
import { SearchInput, type SearchResult } from './schema.js';
import { searchBoxes } from './api.js';
import { renderBoxesTable } from './table.js';
import { ok, fail } from '@/shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '@/shared/output.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { setVerbose, debug } from '@/shared/logger.js';
import { CliError } from '@/shared/errors.js';
import { toCliError } from '@/shared/http/errors.js';
import { formatZodError } from '@/shared/zod-errors.js';

export function registerSearchByGeo(parent: Command): void {
  parent
    .command('+search-by-geo')
    .description('按经纬度搜索附近的门店')
    .requiredOption('--longitude <longitude>', '经度')
    .requiredOption('--latitude <latitude>', '纬度')
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
          longitude: opts.longitude,
          latitude: opts.latitude,
        });
        debug('input', input);
        const data = await searchBoxes(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: SearchResult) => renderBoxesTable(d.list),
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

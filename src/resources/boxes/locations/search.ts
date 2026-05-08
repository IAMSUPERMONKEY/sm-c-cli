import type { Command } from 'commander';
import { z } from 'zod';
import { LocationsSearchInput, type LocationsSearchResult } from './schema.js';
import { searchLocations } from './api.js';
import { renderLocationsTable } from './table.js';
import { ok, fail } from '@/shared/envelope.js';
import { writeEnvelope, parseFormat, type Format } from '@/shared/output.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { setVerbose, debug } from '@/shared/logger.js';
import { CliError } from '@/shared/errors.js';
import { toCliError } from '@/shared/http/errors.js';
import { formatZodError } from '@/shared/zod-errors.js';

function rootOf(cmd: Command): Command {
  let curr: Command = cmd;
  while (curr.parent) curr = curr.parent;
  return curr;
}

export function registerLocationsSearch(parent: Command): void {
  parent
    .command('search')
    .description('按关键词搜索候选地址（含经纬度）')
    .requiredOption('--keyword <keyword>', '地理位置描述，如「海岸城」')
    .action(async (opts: Record<string, unknown>, cmd: Command) => {
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
        const input = LocationsSearchInput.parse({ keyword: opts.keyword });
        debug('input', input);
        const data = await searchLocations(input);
        const env = ok(data);
        writeEnvelope(env, format, {
          table: (d: LocationsSearchResult) => renderLocationsTable(d.list),
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

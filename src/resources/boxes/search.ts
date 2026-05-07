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

export function registerSearch(parent: Command): void {
  parent
    .command('+search')
    .description('按经纬度或地理位置描述搜索附近的门店')
    .option('--lng <lng>', '经度（与 --lat 配套）')
    .option('--lat <lat>', '纬度（与 --lng 配套）')
    .option('--location <location>', '地理位置描述，如「上海市静安区静安寺」')
    .option('--type <type>', '门店业态过滤，目前仅支持 class（团课）')
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
          lng: opts.lng,
          lat: opts.lat,
          location: opts.location,
          type: opts.type,
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

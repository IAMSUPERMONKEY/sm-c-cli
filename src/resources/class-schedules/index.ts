import type { Command } from 'commander';
import { registerSearch } from './search.js';

export function registerClassSchedules(program: Command): void {
  const cmd = program
    .command('class-schedules')
    .description('Class schedule queries');

  registerSearch(cmd);
}

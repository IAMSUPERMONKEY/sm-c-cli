import type { Command } from 'commander';
import { registerSearch } from './search.js';
import { registerOrder } from './order.js';

export function registerClassSchedules(program: Command): void {
  const cmd = program
    .command('class-schedules')
    .description('团课课表');

  registerSearch(cmd);
  registerOrder(cmd);
}

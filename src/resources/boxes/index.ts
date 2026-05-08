import type { Command } from 'commander';
import { registerSearch } from './search.js';
import { registerLocations } from './locations/index.js';

export function registerBoxes(program: Command): void {
  const cmd = program.command('boxes').description('门店/教室');

  registerSearch(cmd);
  registerLocations(cmd);
}

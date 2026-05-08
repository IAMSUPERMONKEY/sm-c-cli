import type { Command } from 'commander';
import { registerLocationsSearch } from './search.js';

export function registerLocations(parent: Command): void {
  const cmd = parent.command('locations').description('地理位置（地址解析）');

  registerLocationsSearch(cmd);
}

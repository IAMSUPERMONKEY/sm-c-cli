import type { Command } from 'commander';
import { registerSearchByGeo } from './searchByGeo.js';
import { registerSearchByKeyword } from './searchByKeyword.js';
import { registerLocations } from './locations/index.js';

export function registerBoxes(program: Command): void {
  const cmd = program.command('boxes').description('门店/教室');

  registerSearchByGeo(cmd);
  registerSearchByKeyword(cmd);
  registerLocations(cmd);
}

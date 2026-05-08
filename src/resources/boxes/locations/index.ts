import type { Command } from 'commander';
import { registerLocationsGeocode } from './geocode.js';

export function registerLocations(parent: Command): void {
  const cmd = parent.command('locations').description('地理位置（地址解析）');

  registerLocationsGeocode(cmd);
}

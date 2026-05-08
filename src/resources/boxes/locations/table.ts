import Table from 'cli-table3';
import pc from 'picocolors';
import { labelOf } from '@/shared/schema-meta.js';
import { Location, type Location as LocationType } from './schema.js';

export function renderLocationsTable(list: LocationType[]): string {
  if (list.length === 0) {
    return '没找到匹配的地址';
  }

  const table = new Table({
    head: [
      labelOf(Location, 'address'),
      labelOf(Location, 'province'),
      labelOf(Location, 'city'),
      labelOf(Location, 'district'),
      labelOf(Location, 'longitude'),
      labelOf(Location, 'latitude'),
    ].map((h) => pc.bold(h)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const l of list) {
    table.push([
      l.address,
      l.province,
      l.city,
      l.district,
      l.longitude,
      l.latitude,
    ]);
  }

  return `${table.toString()}\n${pc.dim(`共 ${list.length} 个候选地址`)}`;
}

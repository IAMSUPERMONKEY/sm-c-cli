import Table from 'cli-table3';
import pc from 'picocolors';
import { labelOf } from '@/shared/schema-meta.js';
import {
  Box,
  BoxByKeyword,
  type Box as BoxType,
  type BoxByKeyword as BoxByKeywordType,
} from './schema.js';

export function renderBoxesTable(list: BoxType[]): string {
  if (list.length === 0) {
    return '没找到附近的门店';
  }

  const table = new Table({
    head: [
      labelOf(Box, 'boxName'),
      '位置',
      labelOf(Box, 'address'),
      labelOf(Box, 'distance'),
      labelOf(Box, 'type'),
    ].map((h) => pc.bold(h)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const b of list) {
    table.push([
      b.boxName,
      formatLocation(b.city, b.area),
      b.address,
      b.distance,
      b.type,
    ]);
  }

  return `${table.toString()}\n${pc.dim(`共 ${list.length} 家门店`)}`;
}

function formatLocation(city: string, area: string): string {
  if (!city) return area;
  if (!area) return city;
  return `${city} ${area}`;
}

export function renderBoxesByKeywordTable(list: BoxByKeywordType[]): string {
  if (list.length === 0) {
    return '没找到匹配的门店';
  }

  const table = new Table({
    head: [
      labelOf(BoxByKeyword, 'brandName'),
      labelOf(BoxByKeyword, 'boxName'),
      '位置',
      labelOf(BoxByKeyword, 'address'),
    ].map((h) => pc.bold(h)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const b of list) {
    table.push([
      b.brandName,
      b.boxName,
      formatLocation(b.city, b.district),
      b.address,
    ]);
  }

  return `${table.toString()}\n${pc.dim(`共 ${list.length} 家门店`)}`;
}

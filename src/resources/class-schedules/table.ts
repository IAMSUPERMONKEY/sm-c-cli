import Table from 'cli-table3';
import pc from 'picocolors';
import { labelOf } from '../../shared/schema-meta.js';
import { ClassSchedule, type ClassSchedule as ClassScheduleType } from './schema.js';

export function renderClassSchedulesTable(list: ClassScheduleType[]): string {
  if (list.length === 0) {
    return '没找到匹配的课程';
  }

  const table = new Table({
    head: [
      labelOf(ClassSchedule, 'scheduleDate'),
      '时间',
      labelOf(ClassSchedule, 'boxName'),
      labelOf(ClassSchedule, 'className'),
      labelOf(ClassSchedule, 'trainerName'),
      labelOf(ClassSchedule, 'price'),
    ].map((h) => pc.bold(h)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const s of list) {
    table.push([
      s.scheduleDate,
      formatTimeRange(s.startTime, s.endTime),
      s.boxName,
      s.className,
      s.trainerName,
      formatPrice(s.price),
    ]);
  }

  return `${table.toString()}\n${pc.dim(`共 ${list.length} 节课`)}`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${hhmm(startTime)}-${hhmm(endTime)}`;
}

function hhmm(datetime: string): string {
  const [, time = ''] = datetime.split(' ');
  return time.slice(0, 5);
}

function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return '免费';
  const yuan = priceInCents / 100;
  return `¥${Number.isInteger(yuan) ? yuan : yuan.toFixed(2)}`;
}

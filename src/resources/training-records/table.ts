import Table from 'cli-table3';
import pc from 'picocolors';
import { labelOf } from '@/shared/schema-meta.js';
import {
  TrainingRecord,
  type TrainingRecord as TrainingRecordType,
} from './schema.js';

const TRAINING_TYPE_LABELS: Record<TrainingRecordType['trainingType'], string> = {
  1: '团体课',
  2: '训练营',
  3: '私教',
};

export function renderTrainingRecordsTable(
  list: TrainingRecordType[],
): string {
  if (list.length === 0) {
    return '暂无运动记录';
  }

  const table = new Table({
    head: [
      labelOf(TrainingRecord, 'scheduleDate'),
      '时间',
      labelOf(TrainingRecord, 'boxName'),
      labelOf(TrainingRecord, 'className'),
      labelOf(TrainingRecord, 'trainerName'),
      labelOf(TrainingRecord, 'trainingType'),
      '状态',
    ].map((heading) => pc.bold(heading)),
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const record of list) {
    table.push([
      record.scheduleDate,
      formatTimeRange(record.startTime, record.endTime),
      record.boxName,
      record.className,
      record.trainerName,
      TRAINING_TYPE_LABELS[record.trainingType],
      formatStatus(record),
    ]);
  }

  return `${table.toString()}\n${pc.dim(`共 ${list.length} 条运动记录`)}`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${hhmm(startTime)}-${hhmm(endTime)}`;
}

function hhmm(datetime: string): string {
  return (datetime.split(' ').at(-1) ?? '').slice(0, 5);
}

function formatStatus(record: TrainingRecordType): string {
  if (record.nonStart === 1) return '未开课';
  if (record.isWait === 1) return '等候中';
  return record.checkin === 1 ? '已签到' : '未签到';
}

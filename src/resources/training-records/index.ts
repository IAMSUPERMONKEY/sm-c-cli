import type { Command } from 'commander';
import { registerList } from './list.js';
import { registerPersonalDetail } from './personal-detail.js';

export function registerTrainingRecords(program: Command): void {
  const cmd = program.command('training-records').description('运动记录');

  registerList(cmd);
  registerPersonalDetail(cmd);
}

import type { Command } from 'commander';
import { registerList } from './list.js';

export function registerTrainingRecords(program: Command): void {
  const cmd = program.command('training-records').description('运动记录');

  registerList(cmd);
}

import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerTrainingRecords } from '../index.js';

describe('运动记录命令注册', () => {
  it('注册 training-records +list 和必填的 --year-month 参数', () => {
    const program = new Command();

    registerTrainingRecords(program);

    const resource = program.commands.find((command) => command.name() === 'training-records');
    const list = resource?.commands.find((command) => command.name() === '+list');
    const yearMonth = list?.options.find((option) => option.long === '--year-month');

    expect(resource?.description()).toBe('运动记录');
    expect(list?.description()).toBe('按月份获取运动记录列表');
    expect(yearMonth?.mandatory).toBe(true);
  });

  it('注册 training-records +personal-detail 及其参数', () => {
    const program = new Command();

    registerTrainingRecords(program);

    const resource = program.commands.find((command) => command.name() === 'training-records');
    const detail = resource?.commands.find((command) => command.name() === '+personal-detail');

    expect(detail?.description()).toBe('获取私教训练详情');
    expect(detail?.options.find((option) => option.long === '--order-type')?.mandatory).toBe(true);
    expect(detail?.options.find((option) => option.long === '--training-id')?.mandatory).toBe(true);
    expect(detail?.options.find((option) => option.long === '--order-id')?.mandatory).toBe(false);
  });
});

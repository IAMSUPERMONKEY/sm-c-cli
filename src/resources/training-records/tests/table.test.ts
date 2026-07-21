import { describe, expect, it } from 'vitest';
import { renderTrainingRecordsTable } from '../table.js';
import type { TrainingRecord } from '../schema.js';

function record(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    boxName: '留仙洞T33全时中心综合训练店',
    className: '精准塑形-臀腿',
    trainingId: 1445941891,
    startTime: '2026-07-15 20:30:00',
    endTime: '2026-07-15 21:30:00',
    trainerStageName: '明天',
    checkin: '已签到',
    trainingType: '团体课',
    ...overrides,
  };
}

describe('运动记录表格', () => {
  it('把运动记录渲染为人类可读表格', () => {
    const output = renderTrainingRecordsTable([record()]);

    expect(output).toContain('日期');
    expect(output).toContain('时间');
    expect(output).toContain('门店名称');
    expect(output).toContain('课程名称');
    expect(output).toContain('教练昵称');
    expect(output).toContain('运动类型');
    expect(output).toContain('状态');
    expect(output).toContain('20:30-21:30');
    expect(output).toContain('团体课');
    expect(output).toContain('已签到');
    expect(output).toContain('共 1 条运动记录');
  });

  it('渲染全部运动类型和签到状态', () => {
    const output = renderTrainingRecordsTable([
      record({ trainingId: 1, trainingType: '训练营', checkin: '未签到' }),
      record({ trainingId: 2, trainingType: '私教' }),
      record({ trainingId: 3, trainingType: '甄选商品' }),
      record({ trainingId: 4, trainingType: 'SGO' }),
    ]);

    expect(output).toContain('训练营');
    expect(output).toContain('私教');
    expect(output).toContain('甄选商品');
    expect(output).toContain('SGO');
    expect(output).toContain('未签到');
  });

  it('空列表渲染为空结果提示', () => {
    expect(renderTrainingRecordsTable([])).toBe('暂无运动记录');
  });
});

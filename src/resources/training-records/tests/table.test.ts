import { describe, expect, it } from 'vitest';
import { renderTrainingRecordsTable } from '../table.js';
import type { TrainingRecord } from '../schema.js';

function record(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    boxId: 1568,
    boxIdSk: 'box-sk',
    boxName: '留仙洞T33全时中心综合训练店',
    classId: 32436,
    className: '精准塑形-臀腿',
    scheduleId: 1445941891,
    scheduleIdSk: 'schedule-sk',
    scheduleDate: '2026-07-15',
    startTime: '2026-07-15 20:30:00',
    endTime: '2026-07-15 21:30:00',
    face: 'https://example.com/face.jpg',
    trainerName: '明天',
    trainerUserId: 30874061,
    trainerUserIdSk: 'trainer-sk',
    nonStart: 0,
    checkin: 1,
    isWait: 0,
    trainingType: 1,
    ...overrides,
  };
}

describe('运动记录表格', () => {
  it('把运动记录渲染为人类可读表格', () => {
    const output = renderTrainingRecordsTable([record()]);

    expect(output).toContain('课表日期');
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

  it('渲染训练营、私教和未开课状态', () => {
    const output = renderTrainingRecordsTable([
      record({ scheduleId: 1, trainingType: 2, checkin: 0, isWait: 1 }),
      record({ scheduleId: 2, trainingType: 3, nonStart: 1 }),
    ]);

    expect(output).toContain('训练营');
    expect(output).toContain('私教');
    expect(output).toContain('等候中');
    expect(output).toContain('未开课');
  });

  it('空列表渲染为空结果提示', () => {
    expect(renderTrainingRecordsTable([])).toBe('暂无运动记录');
  });
});

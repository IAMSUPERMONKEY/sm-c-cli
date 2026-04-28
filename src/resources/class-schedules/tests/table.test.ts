import { describe, it, expect } from 'vitest';
import { renderClassSchedulesTable } from '../table.js';
import type { ClassSchedule } from '../schema.js';

function schedule(overrides: Partial<ClassSchedule> = {}): ClassSchedule {
  return {
    boxId: 1568,
    boxIdSk: 'a38d32a7',
    boxName: '留仙洞T33全时中心综合训练店',
    classId: 32436,
    className: '精准塑形-臀腿',
    endTime: '2026-04-24 21:30:00',
    face: 'https://img.supermonkey.com.cn/trainer/10133/photo.jpeg',
    price: 15900,
    scheduleDate: '2026-04-24',
    scheduleId: 1445941891,
    scheduleIdSk: 'd3ac6ed0',
    startTime: '2026-04-24 20:30:00',
    trainerName: '明天',
    trainerUserId: 30874061,
    trainerUserIdSk: '13af2196',
    ...overrides,
  };
}

describe('renderClassSchedulesTable', () => {
  it('把课表列表渲染成人类可读表格', () => {
    const output = renderClassSchedulesTable([schedule()]);

    expect(output).toContain('课表日期');
    expect(output).toContain('时间');
    expect(output).toContain('门店');
    expect(output).toContain('课程');
    expect(output).toContain('教练');
    expect(output).toContain('价格');
    expect(output).toContain('2026-04-24');
    expect(output).toContain('20:30-21:30');
    expect(output).toContain('精准塑形-臀腿');
    expect(output).toContain('留仙洞T33全时中心综合训练店');
    expect(output).toContain('明天');
    expect(output).toContain('¥159');
    expect(output).toContain('共 1 节课');
  });

  it('价格为 0 时渲染为免费', () => {
    const output = renderClassSchedulesTable([schedule({ price: 0 })]);

    expect(output).toContain('免费');
  });

  it('空列表渲染为空结果提示', () => {
    const output = renderClassSchedulesTable([]);

    expect(output).toBe('没找到匹配的课程');
  });
});

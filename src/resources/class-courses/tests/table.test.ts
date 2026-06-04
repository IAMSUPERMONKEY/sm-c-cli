import { describe, it, expect } from 'vitest';
import { renderClassCoursesTable } from '../table.js';
import type { ClassCourse } from '../schema.js';

function course(overrides: Partial<ClassCourse> = {}): ClassCourse {
  return {
    classId: 101,
    className: '莱美 BODYPUMP',
    classIntroduce: '一节经典的杠铃操课程',
    trainingEffect: '全身肌耐力训练',
    suitablePeople: '想要塑形的人群',
    faq: '需要自带装备吗？不需要。',
    note: '请提前 10 分钟到店',
    ...overrides,
  };
}

describe('renderClassCoursesTable', () => {
  it('把课程列表渲染成人类可读详情', () => {
    const output = renderClassCoursesTable([course()]);

    expect(output).toContain('课程ID');
    expect(output).toContain('课程名称');
    expect(output).toContain('课程简介');
    expect(output).toContain('训练功效');
    expect(output).toContain('适合人群');
    expect(output).toContain('常见问题');
    expect(output).toContain('注意事项');
    expect(output).toContain('莱美 BODYPUMP');
    expect(output).toContain('全身肌耐力训练');
    expect(output).toContain('共 1 门课程');
  });

  it('空列表渲染为空结果提示', () => {
    const output = renderClassCoursesTable([]);
    expect(output).toBe('没找到匹配的课程');
  });
});

import { describe, expect, it } from 'vitest';
import { ListInput } from '../schema.js';

describe('运动记录列表参数', () => {
  it('接受 YYYY-MM 格式的年月', () => {
    expect(ListInput.parse({ yearMonth: '2026-07' })).toEqual({
      yearMonth: '2026-07',
    });
  });

  it('缺少年月时报错', () => {
    expect(() => ListInput.parse({})).toThrow(/--year-month/);
  });

  it.each(['2026-7', '2026/07', '26-07', '2026-13', '2026-00']) (
    '拒绝无效年月 %s',
    (yearMonth) => {
      expect(() => ListInput.parse({ yearMonth })).toThrow(/YYYY-MM/);
    },
  );
});

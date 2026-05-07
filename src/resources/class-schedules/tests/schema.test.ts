import { describe, it, expect } from 'vitest';
import { OrderInput, SearchInput } from '../schema.js';

describe('class-schedules SearchInput', () => {
  it('允许只传 city 和 keyword、不传 date', () => {
    const parsed = SearchInput.parse({ city: '上海', keyword: '单车' });
    expect(parsed).toEqual({ city: '上海', keyword: '单车' });
  });

  it('当 city 为空时报错', () => {
    expect(() => SearchInput.parse({ city: '', keyword: '单车' })).toThrow(
      /--city is required/,
    );
  });

  it('当 keyword 为空时报错', () => {
    expect(() => SearchInput.parse({ city: '上海', keyword: '' })).toThrow(
      /--keyword is required/,
    );
  });
});

describe('class-schedules OrderInput', () => {
  it('字符串形式的 scheduleId 会被转换为数字', () => {
    const parsed = OrderInput.parse({ scheduleId: '1445941891', scheduleIdSk: 'd3ac6ed0' });
    expect(parsed).toEqual({ scheduleId: 1445941891, scheduleIdSk: 'd3ac6ed0' });
  });

  it('数字形式的 scheduleId 直接保留', () => {
    const parsed = OrderInput.parse({ scheduleId: 1445941891, scheduleIdSk: 'd3ac6ed0' });
    expect(parsed.scheduleId).toBe(1445941891);
  });

  it('scheduleId 不是正整数时报错', () => {
    expect(() => OrderInput.parse({ scheduleId: 'abc', scheduleIdSk: 'sk' })).toThrow(
      /--schedule-id must be a positive integer/,
    );
    expect(() => OrderInput.parse({ scheduleId: 0, scheduleIdSk: 'sk' })).toThrow(
      /--schedule-id must be a positive integer/,
    );
  });

  it('scheduleIdSk 为空时报错', () => {
    expect(() => OrderInput.parse({ scheduleId: 1, scheduleIdSk: '' })).toThrow(
      /--schedule-id-sk is required/,
    );
  });
});

import { describe, it, expect } from 'vitest';
import { SearchInput } from '../schema.js';

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

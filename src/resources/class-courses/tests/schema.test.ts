import { describe, it, expect } from 'vitest';
import { SearchInput } from '../schema.js';

describe('class-courses SearchInput', () => {
  it('传入非空 keyword 时通过校验', () => {
    expect(SearchInput.parse({ keyword: '莱美' })).toEqual({
      keyword: '莱美',
    });
  });

  it('缺少 keyword 时报错', () => {
    expect(() => SearchInput.parse({})).toThrow(/--keyword/);
  });

  it('keyword 为空字符串时报错', () => {
    expect(() => SearchInput.parse({ keyword: '' })).toThrow(/--keyword/);
  });
});

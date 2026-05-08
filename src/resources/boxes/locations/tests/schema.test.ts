import { describe, it, expect } from 'vitest';
import { LocationsSearchInput, Location } from '../schema.js';

describe('boxes locations SearchInput', () => {
  it('传入 keyword 时通过校验', () => {
    const parsed = LocationsSearchInput.parse({ keyword: '海岸城' });
    expect(parsed).toEqual({ keyword: '海岸城' });
  });

  it('缺少 keyword 时报错', () => {
    expect(() => LocationsSearchInput.parse({})).toThrow(/--keyword/);
  });

  it('keyword 为空字符串时报错', () => {
    expect(() => LocationsSearchInput.parse({ keyword: '' })).toThrow(
      /--keyword/,
    );
  });
});

describe('boxes Location', () => {
  it('解析完整字段', () => {
    const parsed = Location.parse({
      address: '广东省深圳市南山区文心五路33号',
      country: '中国',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      longitude: '113.9389',
      latitude: '22.5167',
    });
    expect(parsed.city).toBe('深圳市');
    expect(parsed.longitude).toBe('113.9389');
    expect(parsed.latitude).toBe('22.5167');
  });

  it('缺少必填字段时报错', () => {
    expect(() =>
      Location.parse({
        address: '广东省深圳市南山区文心五路33号',
        country: '中国',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        longitude: '113.9389',
      }),
    ).toThrow();
  });
});

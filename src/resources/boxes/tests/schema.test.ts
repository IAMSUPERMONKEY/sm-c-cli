import { describe, it, expect } from 'vitest';
import { Box, SearchInput } from '../schema.js';

describe('boxes SearchInput', () => {
  it('只传 lng 和 lat 时通过校验，且不携带 location', () => {
    const parsed = SearchInput.parse({ lng: 121.45, lat: 31.22 });
    expect(parsed).toEqual({ lng: 121.45, lat: 31.22 });
  });

  it('只传 location 时通过校验', () => {
    const parsed = SearchInput.parse({ location: '上海市静安区静安寺' });
    expect(parsed).toEqual({ location: '上海市静安区静安寺' });
  });

  it('字符串形式的 lng / lat 会被转换为数字', () => {
    const parsed = SearchInput.parse({ lng: '121.45', lat: '31.22' });
    expect(parsed).toEqual({ lng: 121.45, lat: 31.22 });
  });

  it('同时传入经纬度和 location 时校验通过（互斥优先级在 api 层处理）', () => {
    const parsed = SearchInput.parse({
      lng: 121.45,
      lat: 31.22,
      location: '上海市静安区静安寺',
    });
    expect(parsed).toEqual({
      lng: 121.45,
      lat: 31.22,
      location: '上海市静安区静安寺',
    });
  });

  it('传入 type=class 时保留', () => {
    const parsed = SearchInput.parse({ location: '上海', type: 'class' });
    expect(parsed).toEqual({ location: '上海', type: 'class' });
  });

  it('lng / lat / location 都不传时报错', () => {
    expect(() => SearchInput.parse({})).toThrow(
      /either --lng\/--lat or --location is required/,
    );
  });

  it('只传 lng 不传 lat 时报错', () => {
    expect(() => SearchInput.parse({ lng: 121.45 })).toThrow(
      /--lng and --lat must be provided together/,
    );
  });

  it('只传 lat 不传 lng 时报错', () => {
    expect(() => SearchInput.parse({ lat: 31.22 })).toThrow(
      /--lng and --lat must be provided together/,
    );
  });

  it('lng / lat 非数字时报错', () => {
    expect(() => SearchInput.parse({ lng: 'abc', lat: 31.22 })).toThrow(
      /--lng must be a number/,
    );
  });

  it('lng 超出 [-180, 180] 范围时报错', () => {
    expect(() => SearchInput.parse({ lng: 200, lat: 31.22 })).toThrow(
      /--lng must be between -180 and 180/,
    );
  });

  it('lat 超出 [-90, 90] 范围时报错', () => {
    expect(() => SearchInput.parse({ lng: 121.45, lat: 100 })).toThrow(
      /--lat must be between -90 and 90/,
    );
  });

  it('location 为空字符串、且未提供经纬度时报错', () => {
    expect(() => SearchInput.parse({ location: '' })).toThrow(
      /either --lng\/--lat or --location is required/,
    );
  });

  it('type 为非 class 字面量时报错', () => {
    expect(() =>
      SearchInput.parse({ location: '上海', type: 'private' }),
    ).toThrow(/invalid_value/);
  });
});

describe('boxes Box.distance 格式化', () => {
  function rawBox(distance: number) {
    return {
      boxId: 1,
      boxIdSk: 'sk',
      boxName: '门店',
      city: '深圳市',
      area: '福田区',
      address: '地址',
      addressGuide: 'https://example.com',
      distance,
      type: 'class' as const,
    };
  }

  it('小于 1000 米时按米渲染并附带单位', () => {
    expect(Box.parse(rawBox(0)).distance).toBe('0m');
    expect(Box.parse(rawBox(900)).distance).toBe('900m');
    expect(Box.parse(rawBox(999)).distance).toBe('999m');
  });

  it('不小于 1000 米时按千米渲染', () => {
    expect(Box.parse(rawBox(1000)).distance).toBe('1km');
    expect(Box.parse(rawBox(2500)).distance).toBe('2.5km');
  });

  it('千米结果有小数时保留 1 位、整除时不带小数', () => {
    expect(Box.parse(rawBox(1234)).distance).toBe('1.2km');
    expect(Box.parse(rawBox(1289)).distance).toBe('1.3km');
    expect(Box.parse(rawBox(3000)).distance).toBe('3km');
  });

  it('米数有小数时同样保留 1 位', () => {
    expect(Box.parse(rawBox(123.45)).distance).toBe('123.5m');
  });
});

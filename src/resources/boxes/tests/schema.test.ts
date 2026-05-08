import { describe, it, expect } from 'vitest';
import { Box, SearchInput } from '../schema.js';

describe('boxes SearchInput', () => {
  it('同时传入 longitude 和 latitude 时通过校验', () => {
    const parsed = SearchInput.parse({
      longitude: '121.45',
      latitude: '31.22',
    });
    expect(parsed).toEqual({ longitude: '121.45', latitude: '31.22' });
  });

  it('缺少 longitude 时报错', () => {
    expect(() => SearchInput.parse({ latitude: '31.22' })).toThrow(
      /--longitude/,
    );
  });

  it('缺少 latitude 时报错', () => {
    expect(() => SearchInput.parse({ longitude: '121.45' })).toThrow(
      /--latitude/,
    );
  });

  it('longitude 为空字符串时报错', () => {
    expect(() =>
      SearchInput.parse({ longitude: '', latitude: '31.22' }),
    ).toThrow(/--longitude/);
  });

  it('latitude 为空字符串时报错', () => {
    expect(() =>
      SearchInput.parse({ longitude: '121.45', latitude: '' }),
    ).toThrow(/--latitude/);
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

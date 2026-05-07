import { describe, it, expect } from 'vitest';
import { renderBoxesTable } from '../table.js';
import type { Box } from '../schema.js';

function box(overrides: Partial<Box> = {}): Box {
  return {
    boxId: 1568,
    boxIdSk: 'a38d32a7',
    boxName: '福田cocopark单车店',
    city: '深圳市',
    area: '福田区',
    address: '广东省深圳市福田区福华三路269号福田星河cocopark二期2楼L2-050/051号商铺',
    addressGuide: 'https://mp.weixin.qq.com/s/oU264qGic6pVZYV5P9pFLg',
    distance: '999m',
    type: 'class',
    ...overrides,
  };
}

describe('renderBoxesTable', () => {
  it('把门店列表渲染成人类可读表格', () => {
    const output = renderBoxesTable([box()]);

    expect(output).toContain('门店');
    expect(output).toContain('位置');
    expect(output).toContain('地址');
    expect(output).toContain('距离');
    expect(output).toContain('业态');
    expect(output).toContain('福田cocopark单车店');
    expect(output).toContain('深圳市');
    expect(output).toContain('福田区');
    expect(output).toContain('999m');
    expect(output).toContain('共 1 家门店');
  });

  it('空列表渲染为空结果提示', () => {
    const output = renderBoxesTable([]);
    expect(output).toBe('没找到附近的门店');
  });
});


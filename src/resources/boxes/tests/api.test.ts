import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { z } from 'zod';
import { searchBoxes, searchBoxesByKeyword } from '../api.js';
import { getHttpClient } from '@/shared/http/client.js';
import type { Box, BoxByKeyword } from '../schema.js';

vi.mock('../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

type RawBox = z.input<typeof Box>;

function box(overrides: Partial<RawBox> = {}): RawBox {
  return {
    boxId: 1568,
    boxIdSk: 'a38d32a7',
    boxName: '福田cocopark单车店',
    city: '深圳市',
    area: '福田区',
    address: '广东省深圳市福田区福华三路269号福田星河cocopark二期2楼L2-050/051号商铺',
    addressGuide: 'https://mp.weixin.qq.com/s/oU264qGic6pVZYV5P9pFLg',
    distance: 999,
    type: 'class',
    ...overrides,
  };
}

describe('searchBoxes', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求 /boxes/searchByGeo，请求体携带字符串经纬度并固定 distance=10000', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [box()] } },
    });

    await searchBoxes({ longitude: '121.45', latitude: '31.22' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/boxes/searchByGeo', {
      longitude: '121.45',
      latitude: '31.22',
      distance: 10000,
    });
  });

  it('请求体不再携带 type 字段', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [] } },
    });

    await searchBoxes({ longitude: '121.45', latitude: '31.22' });

    expect(post.mock.calls[0]![1]).not.toHaveProperty('type');
  });

  it('成功时返回 data.list', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: { list: [box({ boxId: 1 }), box({ boxId: 2 })] },
      },
    });

    const result = await searchBoxes({
      longitude: '121.45',
      latitude: '31.22',
    });

    expect(result.list.map((b) => b.boxId)).toEqual([1, 2]);
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 30000, msg: 'upstream busted', data: { list: [] } },
    });

    await expect(
      searchBoxes({ longitude: '121.45', latitude: '31.22' }),
    ).rejects.toMatchObject({
      code: 30000,
      message: 'upstream busted',
    });
  });

  it('返回结果按距离正序排序（跨米/千米单位也能正确比较）', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          list: [
            box({ boxId: 1, distance: 2500 }),
            box({ boxId: 2, distance: 300 }),
            box({ boxId: 3, distance: 1200 }),
            box({ boxId: 4, distance: 999 }),
          ],
        },
      },
    });

    const result = await searchBoxes({
      longitude: '121.45',
      latitude: '31.22',
    });

    expect(result.list.map((b) => b.boxId)).toEqual([2, 4, 3, 1]);
    expect(result.list.map((b) => b.distance)).toEqual([
      '300m',
      '999m',
      '1.2km',
      '2.5km',
    ]);
  });
});

type RawBoxByKeyword = z.input<typeof BoxByKeyword>;

function boxByKeyword(overrides: Partial<RawBoxByKeyword> = {}): RawBoxByKeyword {
  return {
    boxId: 1568,
    boxIdSk: 'a38d32a7',
    brandName: '单车店',
    boxName: '福田cocopark单车店',
    city: '深圳市',
    district: '福田区',
    address: '广东省深圳市福田区福华三路269号福田星河cocopark二期2楼L2-050/051号商铺',
    addressGuide: 'https://mp.weixin.qq.com/s/oU264qGic6pVZYV5P9pFLg',
    ...overrides,
  };
}

describe('searchBoxesByKeyword', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求 /boxes/search，请求体携带 k 字段', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [boxByKeyword()] } },
    });

    await searchBoxesByKeyword({ keyword: '深圳 单车' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/boxes/search', { k: '深圳 单车' });
  });

  it('成功时返回 data.list', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          list: [boxByKeyword({ boxId: 1 }), boxByKeyword({ boxId: 2 })],
        },
      },
    });

    const result = await searchBoxesByKeyword({ keyword: '深圳' });

    expect(result.list.map((b) => b.boxId)).toEqual([1, 2]);
  });

  it('上游返回空列表时同样以成功信封返回空数组', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [] } },
    });

    const result = await searchBoxesByKeyword({ keyword: '长沙' });

    expect(result).toEqual({ list: [] });
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 30000, msg: 'upstream busted', data: { list: [] } },
    });

    await expect(searchBoxesByKeyword({ keyword: '深圳' })).rejects.toMatchObject({
      code: 30000,
      message: 'upstream busted',
    });
  });
});

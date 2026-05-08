import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations } from '../api.js';
import { getHttpClient } from '@/shared/http/client.js';

vi.mock('../../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

function loc(overrides: Record<string, string> = {}) {
  return {
    address: '广东省深圳市南山区文心五路33号',
    country: '中国',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    longitude: '113.9389',
    latitude: '22.5167',
    ...overrides,
  };
}

describe('searchLocations', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求 /boxes/geo，并把 keyword 映射成 location', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [loc()] } },
    });

    await searchLocations({ keyword: '海岸城' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/boxes/geo', { location: '海岸城' });
  });

  it('成功时返回 data.list', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          list: [
            loc({ city: '深圳市', district: '南山区' }),
            loc({ city: '厦门市', district: '思明区' }),
          ],
        },
      },
    });

    const result = await searchLocations({ keyword: '海岸城' });

    expect(result.list).toHaveLength(2);
    expect(result.list.map((l) => l.city)).toEqual(['深圳市', '厦门市']);
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 30001, msg: 'geo busted', data: { list: [] } },
    });

    await expect(searchLocations({ keyword: '海岸城' })).rejects.toMatchObject({
      code: 30001,
      message: 'geo busted',
    });
  });

  it('返回空列表时不抛错，正常返回 list: []', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [] } },
    });

    const result = await searchLocations({ keyword: '不存在的位置' });

    expect(result.list).toEqual([]);
  });
});

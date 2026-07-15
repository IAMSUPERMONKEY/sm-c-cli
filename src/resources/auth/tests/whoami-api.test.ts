import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHttpClient } from '@/shared/http/client.js';
import { API_PATHS } from '@/shared/api-paths.js';
import { getWhoAmI } from '../api.js';

vi.mock('@/shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

describe('auth +whoami 接口调用', () => {
  const get = vi.fn();

  beforeEach(() => {
    get.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ get } as never);
  });

  it('通过 GET 请求查询身份且不传请求参数', async () => {
    const data = {
      authInfo: {
        authScopes: [
          { title: '查看课程', description: '允许查看课程和课表信息' },
        ],
        authorizedAt: 1_752_568_800,
        lastUsedAt: 1_752_572_400,
      },
      userInfo: {
        userId: 123456,
        userAvatarUrl: 'https://example.com/avatar.png',
      },
    };
    get.mockResolvedValue({ data: { code: 0, data, msg: 'success' } });

    await expect(getWhoAmI()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith(API_PATHS.authWhoAmI);
  });

  it('透传后端失败信封的业务码和消息', async () => {
    get.mockResolvedValue({
      data: { code: 40102, data: null, msg: '授权令牌已失效' },
    });

    await expect(getWhoAmI()).rejects.toMatchObject({
      code: 40102,
      message: '授权令牌已失效',
    });
  });
});

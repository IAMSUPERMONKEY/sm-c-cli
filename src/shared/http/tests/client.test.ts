import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthToken } from '../../auth-storage.js';
import { getHttpClient } from '../client.js';

vi.mock('../../auth-storage.js', () => ({
  getAuthToken: vi.fn(),
}));
vi.mock('../../client-id.js', () => ({
  getClientId: () => 'test-client-id',
}));

const client = getHttpClient();

beforeEach(() => {
  vi.mocked(getAuthToken).mockReset();
  client.defaults.adapter = async (config: AxiosRequestConfig) =>
    ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }) as AxiosResponse;
});

describe('HTTP 客户端授权头', () => {
  it('配置了登录 token 时插入 Bearer Authorization', async () => {
    vi.mocked(getAuthToken).mockReturnValue('secret-token');

    const response = await client.get('/test');

    expect(response.config.headers.Authorization).toBe('Bearer secret-token');
  });

  it('没有登录 token 时不插入 Authorization', async () => {
    vi.mocked(getAuthToken).mockReturnValue(undefined);

    const response = await client.get('/test');

    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it('每次请求都读取当前 token', async () => {
    vi.mocked(getAuthToken).mockReturnValueOnce('first-token').mockReturnValueOnce('second-token');

    const first = await client.get('/first');
    const second = await client.get('/second');

    expect(first.config.headers.Authorization).toBe('Bearer first-token');
    expect(second.config.headers.Authorization).toBe('Bearer second-token');
  });
});

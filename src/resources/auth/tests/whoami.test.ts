import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_LOGIN_GUIDANCE, saveAuthToken } from '@/shared/auth-storage.js';
import { CliError } from '@/shared/errors.js';
import { loadWhoAmI } from '../whoami.js';

describe('auth +whoami 授权检查', () => {
  it('未配置 token 时提示授权方式且不调用后端', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-whoami-'));
    const request = vi.fn();

    await expect(loadWhoAmI(configDir, request)).rejects.toMatchObject({
      code: 40101,
      message: AUTH_LOGIN_GUIDANCE,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('已配置 token 时调用后端查询身份', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-whoami-'));
    saveAuthToken('secret-token', configDir);
    const data = {
      authInfo: { authScopes: [], authorizedAt: 1_752_568_800 },
      userInfo: {
        userId: 123456,
        userAvatarUrl: 'https://example.com/avatar.png',
      },
    };
    const request = vi.fn().mockResolvedValue(data);

    await expect(loadWhoAmI(configDir, request)).resolves.toEqual(data);
    expect(request).toHaveBeenCalledOnce();
  });

  it('接口返回 401 时透传业务码并提示重新授权', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-whoami-'));
    saveAuthToken('invalid-token', configDir);
    const request = vi.fn().mockRejectedValue(new CliError(401, 'Unauthorized'));

    await expect(loadWhoAmI(configDir, request)).rejects.toMatchObject({
      code: 401,
      message: `授权令牌无效。${AUTH_LOGIN_GUIDANCE}`,
    });
  });

  it('接口响应 HTTP 401 时透传状态码并提示重新授权', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-whoami-'));
    saveAuthToken('invalid-token', configDir);
    const request = vi.fn().mockRejectedValue(
      new AxiosError('Request failed with status code 401', undefined, undefined, undefined, {
        status: 401,
      } as never),
    );

    await expect(loadWhoAmI(configDir, request)).rejects.toMatchObject({
      code: 401,
      message: `授权令牌无效。${AUTH_LOGIN_GUIDANCE}`,
    });
  });

  it('接口返回非 401 错误时透传业务码和消息', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-whoami-'));
    saveAuthToken('secret-token', configDir);
    const request = vi.fn().mockRejectedValue(new CliError(50001, '服务暂不可用'));

    await expect(loadWhoAmI(configDir, request)).rejects.toMatchObject({
      code: 50001,
      message: '服务暂不可用',
    });
  });
});

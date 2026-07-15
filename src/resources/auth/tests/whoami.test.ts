import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_LOGIN_GUIDANCE, saveAuthToken } from '@/shared/auth-storage.js';
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
});

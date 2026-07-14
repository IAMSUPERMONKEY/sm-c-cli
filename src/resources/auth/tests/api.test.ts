import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLI_NAME } from '@/config.js';
import { getConfigDir, login, logout } from '../api.js';

describe('auth login 凭证存储', () => {
  it('默认配置目录使用 config 中定义的 CLI 名称', () => {
    expect(getConfigDir()).toBe(join(homedir(), '.config', CLI_NAME));
  });

  it('把 token 写入指定配置目录且不在返回值中泄露 token', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-'));

    const result = login({ token: 'secret-token' }, configDir);

    expect(result).toEqual({ credentialPath: join(configDir, 'credentials.json') });
    expect(JSON.parse(readFileSync(result.credentialPath, 'utf8'))).toEqual({
      token: 'secret-token',
    });
    expect(result).not.toHaveProperty('token');
  });

  it('凭证文件权限仅允许当前用户读写', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-'));

    const result = login({ token: 'secret-token' }, configDir);

    expect(statSync(result.credentialPath).mode & 0o777).toBe(0o600);
  });

  it('logout 仅删除本地凭证并保留配置目录中的其他文件', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-'));
    const { credentialPath } = login({ token: 'secret-token' }, configDir);
    const clientIdPath = join(configDir, 'client-id');
    writeFileSync(clientIdPath, 'client-id', 'utf8');

    const result = logout(configDir);

    expect(result).toBeUndefined();
    expect(existsSync(credentialPath)).toBe(false);
    expect(existsSync(configDir)).toBe(true);
    expect(readFileSync(clientIdPath, 'utf8')).toBe('client-id');
  });

  it('本地凭证不存在时 logout 仍成功', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-'));

    expect(() => logout(configDir)).not.toThrow();
    expect(existsSync(configDir)).toBe(true);
  });
});

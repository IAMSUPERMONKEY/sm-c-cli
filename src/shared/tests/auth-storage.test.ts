import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clearAuthToken,
  getAuthToken,
  getCredentialPath,
  saveAuthToken,
} from '../auth-storage.js';

describe('授权凭证存储', () => {
  it('保存并读取 token', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-storage-'));

    const credentialPath = saveAuthToken('secret-token', configDir);

    expect(credentialPath).toBe(getCredentialPath(configDir));
    expect(getAuthToken(configDir)).toBe('secret-token');
    expect(JSON.parse(readFileSync(credentialPath, 'utf8'))).toEqual({
      token: 'secret-token',
    });
    expect(statSync(credentialPath).mode & 0o777).toBe(0o600);
  });

  it('凭证不存在或内容无效时不返回 token', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-storage-'));
    expect(getAuthToken(configDir)).toBeUndefined();

    writeFileSync(getCredentialPath(configDir), 'not-json', 'utf8');
    expect(getAuthToken(configDir)).toBeUndefined();

    writeFileSync(getCredentialPath(configDir), JSON.stringify({ token: '   ' }), 'utf8');
    expect(getAuthToken(configDir)).toBeUndefined();
  });

  it('清除 token 但保留配置目录', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-auth-storage-'));
    saveAuthToken('secret-token', configDir);

    clearAuthToken(configDir);

    expect(getAuthToken(configDir)).toBeUndefined();
    expect(statSync(configDir).isDirectory()).toBe(true);
  });
});

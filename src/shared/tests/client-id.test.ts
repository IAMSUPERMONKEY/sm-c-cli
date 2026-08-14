import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  createClientIdGetter,
  deriveClientId,
  deriveFallbackClientId,
  normalizeMachineId,
  readMachineId,
  readOrCreateInstallSecret,
} from '../client-id.js';

function nodeError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

describe('Client ID 派生', () => {
  it('规范化机器标识时只去除首尾空白并转为小写', () => {
    expect(normalizeMachineId('  AA-BB:CC\n')).toBe('aa-bb:cc');
  });

  it('使用版本化命名空间和安装密钥稳定派生 Client ID', () => {
    const secret = Buffer.alloc(32, 1);

    expect(deriveClientId(' MACHINE-ID ', secret)).toBe(
      'v1.ckd1Ei-XFWMADEBQJxSfcrUFtDWLK2IzSoDWDjCci6s',
    );
    expect(deriveClientId('machine-id', secret)).toBe(deriveClientId(' MACHINE-ID ', secret));
    expect(deriveClientId('another-machine', secret)).not.toBe(
      deriveClientId('machine-id', secret),
    );
    expect(deriveClientId('machine-id', Buffer.alloc(32, 2))).not.toBe(
      deriveClientId('machine-id', secret),
    );
  });

  it('机器标识不可用时稳定派生随机安装级 Client ID', () => {
    const secret = Buffer.alloc(32, 1);

    expect(deriveFallbackClientId(secret)).toBe('v1r.MRous3pLRFYyZnHp063jkcikW5auEnuFfr-YmoWYmSE');
  });
});

describe('机器标识读取', () => {
  it('Linux 优先读取 /etc/machine-id 并在缺失时回退到 dbus 文件', () => {
    const readTextFile = vi.fn((file: string) => {
      if (file === '/etc/machine-id') throw nodeError('ENOENT');
      return ' DBUS-ID\n';
    });

    expect(readMachineId('linux', { readTextFile })).toBe('dbus-id');
    expect(readTextFile).toHaveBeenNthCalledWith(1, '/etc/machine-id');
    expect(readTextFile).toHaveBeenNthCalledWith(2, '/var/lib/dbus/machine-id');
  });

  it('macOS 从 ioreg 输出中提取 IOPlatformUUID', () => {
    const runCommand = vi.fn(() => '    "IOPlatformUUID" = "ABC-123"\n');

    expect(readMachineId('darwin', { runCommand })).toBe('abc-123');
    expect(runCommand).toHaveBeenCalledWith('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice']);
  });

  it('Windows 从注册表输出中提取 MachineGuid', () => {
    const runCommand = vi.fn(
      () => '    MachineGuid    REG_SZ    01234567-89AB-CDEF-0123-456789ABCDEF\r\n',
    );

    expect(readMachineId('win32', { runCommand })).toBe('01234567-89ab-cdef-0123-456789abcdef');
  });

  it('机器标识为空、命令失败或平台不支持时返回 undefined', () => {
    expect(readMachineId('linux', { readTextFile: () => '  ' })).toBeUndefined();
    expect(
      readMachineId('darwin', {
        runCommand: () => {
          throw new Error('failed');
        },
      }),
    ).toBeUndefined();
    expect(readMachineId('aix')).toBeUndefined();
  });
});

describe('安装密钥存储', () => {
  it('首次使用独占写入创建版本化的 32 字节密钥并设置 0600 权限', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-client-id-'));
    const secretFile = join(configDir, 'nested', 'client-id-secret');

    const secret = readOrCreateInstallSecret(secretFile);

    const stored = JSON.parse(readFileSync(secretFile, 'utf8')) as unknown;
    expect(secret).toHaveLength(32);
    expect(stored).toEqual({ version: 1, secret: secret.toString('base64url') });
    expect(statSync(secretFile).mode & 0o777).toBe(0o600);
    expect(readOrCreateInstallSecret(secretFile)).toEqual(secret);
  });

  it.each([
    ['JSON 无法解析', 'not-json'],
    [
      '版本不受支持',
      JSON.stringify({ version: 2, secret: Buffer.alloc(32).toString('base64url') }),
    ],
    ['密钥不是 32 字节', JSON.stringify({ version: 1, secret: 'c2hvcnQ' })],
    ['密钥不是 Base64URL', JSON.stringify({ version: 1, secret: '*'.repeat(43) })],
  ])('拒绝无效密钥文件：%s', (_label, contents) => {
    const configDir = mkdtempSync(join(tmpdir(), 'sm-c-cli-client-id-'));
    const secretFile = join(configDir, 'client-id-secret');
    writeFileSync(secretFile, contents, 'utf8');

    expect(() => readOrCreateInstallSecret(secretFile)).toThrow('Client ID 安装密钥文件无效');
  });

  it('并发创建遇到 EEXIST 时有限重试并读取胜出进程写入的密钥', () => {
    const winnerSecret = Buffer.alloc(32, 2);
    const readTextFile = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw nodeError('ENOENT');
      })
      .mockReturnValueOnce('')
      .mockReturnValueOnce(
        JSON.stringify({ version: 1, secret: winnerSecret.toString('base64url') }),
      );
    const sleep = vi.fn();

    const secret = readOrCreateInstallSecret('/config/client-id-secret', {
      ensureDirectory: vi.fn(),
      randomBytes: () => Buffer.alloc(32, 1),
      readTextFile,
      sleep,
      writeTextFileExclusive: () => {
        throw nodeError('EEXIST');
      },
    });

    expect(secret).toEqual(winnerSecret);
    expect(readTextFile).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('首次读取到尚未写完的密钥文件时有限重试', () => {
    const winnerSecret = Buffer.alloc(32, 2);
    const readTextFile = vi
      .fn<() => string>()
      .mockReturnValueOnce('')
      .mockReturnValueOnce(
        JSON.stringify({ version: 1, secret: winnerSecret.toString('base64url') }),
      );
    const sleep = vi.fn();

    const secret = readOrCreateInstallSecret('/config/client-id-secret', {
      ensureDirectory: vi.fn(),
      readTextFile,
      sleep,
      writeTextFileExclusive: vi.fn(),
    });

    expect(secret).toEqual(winnerSecret);
    expect(readTextFile).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});

describe('Client ID 获取', () => {
  it('同一进程只读取一次机器标识和安装密钥', () => {
    const getMachineId = vi.fn(() => 'machine-id');
    const getInstallSecret = vi.fn(() => Buffer.alloc(32, 1));
    const getClientId = createClientIdGetter({
      configDir: '/config',
      getInstallSecret,
      getMachineId,
    });

    expect(getClientId()).toBe('v1.ckd1Ei-XFWMADEBQJxSfcrUFtDWLK2IzSoDWDjCci6s');
    expect(getClientId()).toBe('v1.ckd1Ei-XFWMADEBQJxSfcrUFtDWLK2IzSoDWDjCci6s');
    expect(getMachineId).toHaveBeenCalledTimes(1);
    expect(getInstallSecret).toHaveBeenCalledTimes(1);
    expect(getInstallSecret).toHaveBeenCalledWith('/config/client-id-secret');
  });

  it('机器标识不可用时使用降级 Client ID', () => {
    const getClientId = createClientIdGetter({
      getInstallSecret: () => Buffer.alloc(32, 1),
      getMachineId: () => undefined,
    });

    expect(getClientId()).toBe('v1r.MRous3pLRFYyZnHp063jkcikW5auEnuFfr-YmoWYmSE');
  });
});

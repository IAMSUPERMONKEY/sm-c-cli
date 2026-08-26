import { describe, expect, it, vi } from 'vitest';

import type { CommandRunner } from '../command-runner.js';
import { UpdateService } from '../update-service.js';

const officialRegistry = 'https://registry.npmjs.org/';

function createRunner(outputs: string[]): CommandRunner {
  return {
    run: vi.fn(async () => ({ stdout: outputs.shift() ?? '', stderr: '' })),
  };
}

describe('UpdateService', () => {
  it('发现新版本后使用默认官方 registry 升级 CLI 并更新 Skills', async () => {
    const runner = createRunner(['1.2.0\n', '', '']);
    const progress = vi.fn();
    const service = new UpdateService(runner, '1.1.0', undefined, progress);

    const result = await service.update();

    expect(runner.run).toHaveBeenNthCalledWith(1, 'npm', [
      'view',
      'sm-c-cli',
      'version',
      '--registry',
      officialRegistry,
    ]);
    expect(runner.run).toHaveBeenNthCalledWith(2, 'npm', [
      'install',
      '--global',
      'sm-c-cli@latest',
      '--registry',
      officialRegistry,
    ]);
    expect(runner.run).toHaveBeenNthCalledWith(3, 'npx', [
      '--yes',
      'skills',
      'add',
      'IAMSUPERMONKEY/sm-c-cli',
      '-y',
      '-g',
    ]);
    expect(result).toEqual({
      previousVersion: '1.1.0',
      latestVersion: '1.2.0',
      cliUpdated: true,
      skillsUpdated: true,
    });
  });

  it('使用调用方传入的 registry 检查并升级 CLI', async () => {
    const registry = 'https://registry.example.com/npm/';
    const runner = createRunner(['2.0.0\n', '', '']);
    const service = new UpdateService(runner, '1.1.0', registry);

    await service.update();

    expect(runner.run).toHaveBeenNthCalledWith(
      1,
      'npm',
      expect.arrayContaining(['--registry', registry]),
    );
    expect(runner.run).toHaveBeenNthCalledWith(
      2,
      'npm',
      expect.arrayContaining(['--registry', registry]),
    );
  });

  it('已是最新版本时不重装 CLI 但仍更新 Skills', async () => {
    const runner = createRunner(['1.1.0\n', '']);
    const service = new UpdateService(runner, '1.1.0');

    const result = await service.update();

    expect(runner.run).toHaveBeenCalledTimes(2);
    expect(runner.run).not.toHaveBeenCalledWith('npm', expect.arrayContaining(['install']));
    expect(result.cliUpdated).toBe(false);
    expect(result.skillsUpdated).toBe(true);
  });

  it('本地版本高于 registry 版本时不会降级', async () => {
    const runner = createRunner(['1.1.0\n', '']);
    const service = new UpdateService(runner, '2.0.0');

    await service.update();

    expect(runner.run).not.toHaveBeenCalledWith('npm', expect.arrayContaining(['install']));
  });

  it('CLI 升级失败后立即停止且不更新 Skills', async () => {
    const runner: CommandRunner = {
      run: vi
        .fn<CommandRunner['run']>()
        .mockResolvedValueOnce({ stdout: '1.2.0\n', stderr: '' })
        .mockRejectedValueOnce(new Error('install failed')),
    };
    const service = new UpdateService(runner, '1.1.0');

    await expect(service.update()).rejects.toThrow('install failed');
    expect(runner.run).toHaveBeenCalledTimes(2);
  });

  it('拒绝 registry 返回的非法版本号', async () => {
    const runner = createRunner(['not-a-version\n']);
    const service = new UpdateService(runner, '1.1.0');

    await expect(service.update()).rejects.toMatchObject({ code: 30000 });
  });
});

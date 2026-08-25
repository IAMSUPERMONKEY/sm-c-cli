import { Command } from 'commander';
import { describe, expect, it } from 'vitest';

import { DEFAULT_NPM_REGISTRY, registerUpdate } from '../update-command.js';

describe('update 命令注册', () => {
  it('注册 update 命令并默认使用 npm 官方 registry', () => {
    const program = new Command();

    registerUpdate(program);

    const update = program.commands.find((command) => command.name() === 'update');
    const registry = update?.options.find((option) => option.long === '--registry');

    expect(update?.description()).toBe('升级 sm-c-cli 并同步全局 Skills');
    expect(registry?.description).toBe('指定 npm registry 地址');
    expect(registry?.defaultValue).toBe(DEFAULT_NPM_REGISTRY);
    expect(DEFAULT_NPM_REGISTRY).toBe('https://registry.npmjs.org/');
  });
});

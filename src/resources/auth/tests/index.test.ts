import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerAuth } from '../index.js';

describe('auth 命令注册', () => {
  it('注册用户授权资源和可选 token 参数的 login 原子命令', () => {
    const program = new Command();

    registerAuth(program);

    const auth = program.commands.find((command) => command.name() === 'auth');
    const login = auth?.commands.find((command) => command.name() === 'login');
    const logout = auth?.commands.find((command) => command.name() === 'logout');
    const token = login?.options.find((option) => option.long === '--token');

    expect(auth?.description()).toBe('用户授权');
    expect(login).toBeDefined();
    expect(logout?.description()).toBe('退出登录并删除本地凭证');
    expect(token?.mandatory).toBe(false);
  });
});

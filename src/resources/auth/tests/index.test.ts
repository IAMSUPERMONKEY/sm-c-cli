import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerAuth } from '../index.js';

describe('auth 命令注册', () => {
  it('注册用户授权资源、原子命令和 +whoami 高频命令', () => {
    const program = new Command();

    registerAuth(program);

    const auth = program.commands.find((command) => command.name() === 'auth');
    const login = auth?.commands.find((command) => command.name() === 'login');
    const logout = auth?.commands.find((command) => command.name() === 'logout');
    const whoami = auth?.commands.find((command) => command.name() === '+whoami');
    const token = login?.options.find((option) => option.long === '--token');

    expect(auth?.description()).toBe('用户授权');
    expect(login).toBeDefined();
    expect(logout?.description()).toBe('退出登录并删除本地凭证');
    expect(whoami?.description()).toBe('查看当前用户身份和授权信息');
    expect(token?.mandatory).toBe(false);
  });
});

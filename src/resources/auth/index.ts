import type { Command } from 'commander';
import { registerLogin } from './login.js';
import { registerLogout } from './logout.js';

export function registerAuth(program: Command): void {
  const cmd = program.command('auth').description('用户授权');

  registerLogin(cmd);
  registerLogout(cmd);
}

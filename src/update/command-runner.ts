import { spawn } from 'node:child_process';

import { CliError } from '@/shared/errors.js';

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export interface CommandRunner {
  run(command: string, args: readonly string[]): Promise<CommandResult>;
}

function resolveExecutable(command: string): string {
  if (process.platform !== 'win32') {
    return command;
  }

  return command === 'npm' || command === 'npx' ? `${command}.cmd` : command;
}

export class NodeCommandRunner implements CommandRunner {
  run(command: string, args: readonly string[]): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(resolveExecutable(command), args, {
        env: { ...process.env, CI: 'true' },
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
      child.once('error', () => {
        reject(new CliError(30000, `无法执行更新命令：${command}`));
      });
      child.once('close', (exitCode, signal) => {
        const result = {
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
        };

        if (exitCode === 0) {
          resolve(result);
          return;
        }

        const reason = signal ? `，信号：${signal}` : '';
        reject(new CliError(30000, `更新命令执行失败：${command}（退出码：${exitCode}${reason}）`));
      });
    });
  }
}

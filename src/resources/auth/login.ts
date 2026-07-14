import { createInterface } from 'node:readline/promises';
import type { Command } from 'commander';
import { z } from 'zod';
import { login } from './api.js';
import { LoginInput } from './schema.js';
import { ok, fail } from '@/shared/envelope.js';
import { CliError } from '@/shared/errors.js';
import { exitCodeOf } from '@/shared/exit-codes.js';
import { toCliError } from '@/shared/http/errors.js';
import { parseFormat, writeEnvelope, type Format } from '@/shared/output.js';
import { formatZodError } from '@/shared/zod-errors.js';

type TokenPrompt = () => Promise<string>;

function rootOf(cmd: Command): Command {
  let curr = cmd;
  while (curr.parent) curr = curr.parent;
  return curr;
}

export async function promptForToken(
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stderr,
): Promise<string> {
  const readline = createInterface({ input, output });
  try {
    return await readline.question('请输入 token 并回车继续：');
  } finally {
    readline.close();
  }
}

export async function resolveToken(
  optionToken: string | undefined,
  prompt: TokenPrompt = promptForToken,
): Promise<string> {
  const token = optionToken?.trim();
  return token || (await prompt()).trim();
}

export function registerLogin(parent: Command): void {
  parent
    .command('login')
    .description('使用 token 登录')
    .option('--token <token>', '用户授权 token')
    .action(async (opts: { token?: string }, cmd: Command) => {
      const root = rootOf(cmd);
      const rawFormat = (root.opts().format as string | undefined) ?? 'json';

      let format: Format = 'json';
      try {
        format = parseFormat(rawFormat);
      } catch (err) {
        const cliErr = new CliError(40002, (err as Error).message);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, 'json');
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }

      try {
        const token = await resolveToken(opts.token);
        const input = LoginInput.parse({ token });
        const env = ok(login(input));
        writeEnvelope(env, format);
        process.exit(exitCodeOf(env.code));
      } catch (err) {
        const cliErr =
          err instanceof z.ZodError
            ? new CliError(40001, formatZodError(err))
            : toCliError(err);
        const env = fail(cliErr.code, cliErr.message);
        writeEnvelope(env, format);
        process.stderr.write(`${cliErr.message}\n`);
        process.exit(exitCodeOf(env.code));
      }
    });
}

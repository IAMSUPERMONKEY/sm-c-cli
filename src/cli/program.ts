import { Command } from 'commander';
import { registerResources } from './register.js';
import { PKG_VERSION } from '../config.js';

const CLI_NAME = 'sm-c-cli';

export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .version(PKG_VERSION, '-v, --version')
    .option('--format <format>', '输出格式：json | ndjson | table | pretty', 'json')
    .option('--verbose', '将调试日志写到 stderr', false);

  registerResources(program);

  return program;
}

import { Command } from 'commander';
import { registerResources } from './register.js';
import { PKG_NAME, PKG_VERSION } from '../config.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name(PKG_NAME)
    .version(PKG_VERSION, '-v, --version')
    .option('--format <format>', 'output format: json | ndjson | table | pretty', 'json')
    .option('--verbose', 'verbose logging to stderr', false);

  registerResources(program);

  return program;
}

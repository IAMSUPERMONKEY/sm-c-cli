import path from 'node:path';
import fs from 'node:fs';
import type { Command } from 'commander';

export function registerSkills(program: Command): void {
  const cmd = program.command('skills').description('Skills 资源');

  cmd
    .command('+get-path')
    .description('获取已发布 sm-cli 包内 skills 目录的完整路径')
    .action(() => {
      const entry = fs.realpathSync(process.argv[1]!);
      const pkgRoot = path.resolve(path.dirname(entry), '..');
      const skillsPath = path.join(pkgRoot, 'skills');
      process.stdout.write(`${skillsPath}\n`);
    });
}

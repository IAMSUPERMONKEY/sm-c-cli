import type { Command } from 'commander';
import { registerSearch } from './search.js';

export function registerClassCourses(program: Command): void {
  const cmd = program.command('class-courses').description('团课课程');

  registerSearch(cmd);
}

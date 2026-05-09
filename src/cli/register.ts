import type { Command } from 'commander';
import { registerClassSchedules } from '../resources/class-schedules/index.js';
import { registerBoxes } from '../resources/boxes/index.js';
import { registerSkills } from '../resources/skills/index.js';

export function registerResources(program: Command): void {
  registerClassSchedules(program);
  registerBoxes(program);
  registerSkills(program);
}

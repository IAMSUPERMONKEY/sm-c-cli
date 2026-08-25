import type { Command } from 'commander';
import { registerClassSchedules } from '../resources/class-schedules/index.js';
import { registerClassCourses } from '../resources/class-courses/index.js';
import { registerBoxes } from '../resources/boxes/index.js';
import { registerSkills } from '../resources/skills/index.js';
import { registerAuth } from '../resources/auth/index.js';
import { registerTrainingRecords } from '../resources/training-records/index.js';
import { registerUpdate } from '../update/update-command.js';

export function registerResources(program: Command): void {
  registerClassSchedules(program);
  registerClassCourses(program);
  registerBoxes(program);
  registerSkills(program);
  registerAuth(program);
  registerTrainingRecords(program);
  registerUpdate(program);
}

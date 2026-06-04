import Table from 'cli-table3';
import pc from 'picocolors';
import { labelOf } from '@/shared/schema-meta.js';
import { ClassCourse, type ClassCourse as ClassCourseType } from './schema.js';

const FIELDS = [
  'classId',
  'className',
  'classIntroduce',
  'trainingEffect',
  'suitablePeople',
  'faq',
  'note',
] as const;

export function renderClassCoursesTable(list: ClassCourseType[]): string {
  if (list.length === 0) {
    return '没找到匹配的课程';
  }

  const blocks = list.map((course) => {
    const table = new Table({
      style: { head: [], border: [] },
      colWidths: [12, 60],
      wordWrap: true,
    });

    for (const field of FIELDS) {
      table.push([pc.bold(labelOf(ClassCourse, field)), String(course[field])]);
    }

    return table.toString();
  });

  return `${blocks.join('\n')}\n${pc.dim(`共 ${list.length} 门课程`)}`;
}

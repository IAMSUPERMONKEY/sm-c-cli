import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { labelOf, labelsOf } from '../schema-meta.js';

const ExampleSchema = z.object({
  named: z.string().describe('中文名称'),
  unnamed: z.number(),
});

describe('schema-meta', () => {
  it('优先读取字段 description 作为中文标签', () => {
    expect(labelOf(ExampleSchema, 'named')).toBe('中文名称');
  });

  it('没有 description 时回退到字段名', () => {
    expect(labelOf(ExampleSchema, 'unnamed')).toBe('unnamed');
  });

  it('按传入字段顺序批量返回标签', () => {
    expect(labelsOf(ExampleSchema, ['named', 'unnamed'])).toEqual(['中文名称', 'unnamed']);
  });
});

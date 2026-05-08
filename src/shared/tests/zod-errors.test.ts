import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { formatZodError } from '../zod-errors.js';

function captureError<T>(fn: () => T): z.ZodError {
  try {
    fn();
  } catch (err) {
    if (err instanceof z.ZodError) return err;
    throw err;
  }
  throw new Error('expected ZodError to be thrown');
}

describe('formatZodError', () => {
  it('issue 自带 -- 前缀的消息原样返回（不重复加 flag 前缀）', () => {
    const schema = z.object({
      lng: z.number({ error: '--lng must be a number' }),
    });
    const err = captureError(() => schema.parse({ lng: 'abc' }));

    expect(formatZodError(err)).toBe('--lng must be a number');
  });

  it('zod 内置消息会带上由字段名推断的 flag 前缀', () => {
    const schema = z.object({
      type: z.enum(['class']),
    });
    const err = captureError(() => schema.parse({ type: 'private' }));

    expect(formatZodError(err)).toMatch(/^--type, /);
    expect(formatZodError(err)).toContain('expected');
  });

  it('camelCase 字段名转换成 kebab-case flag', () => {
    const schema = z.object({
      scheduleId: z.string().min(1),
    });
    const err = captureError(() => schema.parse({ scheduleId: '' }));

    expect(formatZodError(err)).toMatch(/^--schedule-id, /);
  });

  it('顶层 superRefine 抛出的 issue（path 为空）原样返回 message', () => {
    const schema = z
      .object({ a: z.string().optional(), b: z.string().optional() })
      .superRefine((_v, ctx) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'either --a or --b is required',
        });
      });
    const err = captureError(() => schema.parse({}));

    expect(formatZodError(err)).toBe('either --a or --b is required');
  });

  it('没有 issue 时返回兜底文案', () => {
    const empty = new z.ZodError([]);
    expect(formatZodError(empty)).toBe('invalid argument');
  });
});

import { describe, it, expect } from 'vitest';
import { parseFormat } from '../output.js';

describe('parseFormat', () => {
  it('接受 json、ndjson、table、pretty 四种格式', () => {
    expect(parseFormat('json')).toBe('json');
    expect(parseFormat('ndjson')).toBe('ndjson');
    expect(parseFormat('table')).toBe('table');
    expect(parseFormat('pretty')).toBe('pretty');
  });

  it('拒绝未知格式', () => {
    expect(() => parseFormat('xml')).toThrow('invalid format: xml');
  });
});

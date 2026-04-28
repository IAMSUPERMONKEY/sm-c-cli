import { describe, it, expect } from 'vitest';
import { colorizeJson, stripAnsi } from '../json-color.js';

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

describe('colorizeJson', () => {
  it('启用颜色时输出 ANSI 序列，去色后仍是合法 JSON', () => {
    const input = { code: 0, data: { list: [1, 2] }, msg: 'success', flag: true, n: null };
    const colored = colorizeJson(input, { color: true });

    expect(colored).toMatch(ANSI);
    const stripped = stripAnsi(colored);
    expect(JSON.parse(stripped)).toEqual(input);
  });

  it('禁用颜色时输出纯 JSON，无 ANSI 序列', () => {
    const input = { a: 1, b: 'x' };
    const out = colorizeJson(input, { color: false });

    expect(out).not.toMatch(ANSI);
    expect(JSON.parse(out)).toEqual(input);
  });

  it('输出多行缩进，便于人读', () => {
    const out = colorizeJson({ a: 1 }, { color: false });
    expect(out).toContain('\n');
    expect(out).toContain('  ');
  });

  it('字符串中包含 JSON 标点字符时仍能正确解析', () => {
    const input = { msg: '错误：{"code":1}', list: ['a:b', '[x]'] };
    const out = colorizeJson(input, { color: true });

    expect(JSON.parse(stripAnsi(out))).toEqual(input);
  });
});

import { describe, it, expect } from 'vitest';
import { ok, fail } from '../envelope.js';
import { exitCodeOf, EXIT } from '../exit-codes.js';

describe('envelope', () => {
  it('ok 包装数据，code 为 0、msg 为 success', () => {
    expect(ok({ list: [] })).toEqual({
      code: 0,
      data: { list: [] },
      msg: 'success',
    });
  });

  it('fail 返回空对象作为 data', () => {
    expect(fail(40001, 'invalid argument: --city is required')).toEqual({
      code: 40001,
      data: {},
      msg: 'invalid argument: --city is required',
    });
  });
});

describe('exitCodeOf', () => {
  it('0 映射到 OK', () => {
    expect(exitCodeOf(0)).toBe(EXIT.OK);
  });
  it('4xxxx 映射到 INVALID_ARG', () => {
    expect(exitCodeOf(40001)).toBe(EXIT.INVALID_ARG);
  });
  it('401xx 映射到 AUTH', () => {
    expect(exitCodeOf(40101)).toBe(EXIT.AUTH);
  });
  it('HTTP 401 映射到 AUTH', () => {
    expect(exitCodeOf(401)).toBe(EXIT.AUTH);
  });
  it('3xxxx 映射到 UPSTREAM', () => {
    expect(exitCodeOf(30000)).toBe(EXIT.UPSTREAM);
  });
  it('其他业务码兜底到 GENERIC', () => {
    expect(exitCodeOf(1)).toBe(EXIT.GENERIC);
  });
});

import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { promptForToken, resolveToken } from '../login.js';

describe('auth login token 获取', () => {
  it('传入 token 参数时直接使用，不触发交互提示', async () => {
    let prompted = false;

    const token = await resolveToken('  token-from-option  ', async () => {
      prompted = true;
      return 'token-from-prompt';
    });

    expect(token).toBe('token-from-option');
    expect(prompted).toBe(false);
  });

  it('未传 token 参数时提示用户输入并等待回车', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let prompt = '';
    output.on('data', (chunk) => {
      prompt += chunk.toString();
    });

    input.end('token-from-prompt\n');
    const token = await promptForToken(input, output);

    expect(token).toBe('token-from-prompt');
    expect(prompt).toContain('请输入 token');
  });

  it('token 仅包含空白字符时视为未传并触发交互提示', async () => {
    const token = await resolveToken('   ', async () => 'token-from-prompt');

    expect(token).toBe('token-from-prompt');
  });
});

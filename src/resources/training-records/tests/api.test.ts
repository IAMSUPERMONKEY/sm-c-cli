import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listTrainingRecords } from '../api.js';
import { getHttpClient } from '@/shared/http/client.js';
import type { TrainingRecord } from '../schema.js';

vi.mock('../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

function record(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    boxName: '留仙洞T33全时中心综合训练店',
    className: '精准塑形-臀腿',
    trainingId: 1445941891,
    startTime: '2026-07-15 20:30:00',
    endTime: '2026-07-15 21:30:00',
    trainerStageName: '明天',
    checkin: 1,
    trainingType: 1,
    ...overrides,
  };
}

describe('查询运动记录列表', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求运动记录路径，并把 yearMonth 映射为 date', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [record()] } },
    });

    await listTrainingRecords({ yearMonth: '2026-07' });

    expect(post).toHaveBeenCalledWith('/training-records/queryList', {
      date: '2026-07',
    });
  });

  it('成功时返回运动记录列表', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: { list: [record({ trainingId: 1 }), record({ trainingId: 2 })] },
      },
    });

    const result = await listTrainingRecords({ yearMonth: '2026-07' });

    expect(result.list.map((item) => item.trainingId)).toEqual([1, 2]);
  });

  it('上游返回空列表时仍然成功', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [] } },
    });

    await expect(listTrainingRecords({ yearMonth: '2026-07' })).resolves.toEqual({ list: [] });
  });

  it('上游信封 code 非 0 时透传 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 30000, msg: 'upstream busted', data: { list: [] } },
    });

    await expect(listTrainingRecords({ yearMonth: '2026-07' })).rejects.toMatchObject({
      code: 30000,
      message: 'upstream busted',
    });
  });
});

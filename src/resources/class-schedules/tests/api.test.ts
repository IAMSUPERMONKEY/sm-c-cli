import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClassScheduleOrderCode, searchClassSchedules } from '../api.js';
import { getHttpClient } from '../../../shared/http/client.js';
import type { ClassSchedule } from '../schema.js';

vi.mock('../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

function schedule(id: number): ClassSchedule {
  return {
    boxId: id,
    boxIdSk: `b${id}`,
    boxName: `店${id}`,
    classId: id,
    className: `课${id}`,
    endTime: '2026-04-28 21:30:00',
    face: 'https://example.com/face.jpg',
    price: 15900,
    scheduleDate: '2026-04-28',
    scheduleId: id,
    scheduleIdSk: `s${id}`,
    startTime: '2026-04-28 20:30:00',
    trainerName: '教练',
    trainerUserId: id,
    trainerUserIdSk: `t${id}`,
  };
}

describe('searchClassSchedules', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求课表搜索路径，并带上 searchType=1、limit、offset', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: { list: [schedule(1)], limit: 50, offset: 0, totalHits: 1 },
      },
    });

    await searchClassSchedules({ city: '上海市', keyword: '单车', date: '2026-04-28' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/class-schedules/search', {
      city: '上海市',
      keyword: '单车',
      searchType: 1,
      date: '2026-04-28',
      limit: 50,
      offset: 0,
    });
  });

  it('未传 date 时，请求参数中不包含 date 字段', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [], limit: 50, offset: 0, totalHits: 0 } },
    });

    await searchClassSchedules({ city: '上海市', keyword: '单车' });

    expect(post.mock.calls[0]![1]).not.toHaveProperty('date');
  });

  it('totalHits 超过 pageSize 时自动聚合所有分页', async () => {
    post.mockImplementation(async (_path, body) => {
      const { offset } = body as { offset: number };
      if (offset === 0) {
        return {
          data: {
            code: 0,
            msg: 'success',
            data: {
              list: [schedule(0), schedule(1)],
              limit: 2,
              offset: 0,
              totalHits: 3,
            },
          },
        };
      }
      return {
        data: {
          code: 0,
          msg: 'success',
          data: { list: [schedule(2)], limit: 2, offset: 2, totalHits: 3 },
        },
      };
    });

    const result = await searchClassSchedules(
      { city: '上海市', keyword: '单车' },
      { pageSize: 2, intervalMs: 0 },
    );

    expect(result.list).toHaveLength(3);
    expect(post).toHaveBeenCalledTimes(2);
    expect((post.mock.calls[1]![1] as { offset: number }).offset).toBe(2);
  });

  it('分页结果中存在重复 scheduleId 时按 scheduleId 去重并保留原顺序', async () => {
    post.mockImplementation(async (_path, body) => {
      const { offset } = body as { offset: number };
      if (offset === 0) {
        return {
          data: {
            code: 0,
            msg: 'success',
            data: {
              list: [schedule(1), schedule(2)],
              limit: 2,
              offset: 0,
              totalHits: 4,
            },
          },
        };
      }
      return {
        data: {
          code: 0,
          msg: 'success',
          data: {
            list: [schedule(2), schedule(3)],
            limit: 2,
            offset: 2,
            totalHits: 4,
          },
        },
      };
    });

    const result = await searchClassSchedules(
      { city: '上海市', keyword: '单车' },
      { pageSize: 2, intervalMs: 0 },
    );

    expect(result.list.map((s) => s.scheduleId)).toEqual([1, 2, 3]);
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 30000,
        msg: 'upstream busted',
        data: { list: [], limit: 50, offset: 0, totalHits: 0 },
      },
    });

    await expect(
      searchClassSchedules({ city: '上海市', keyword: '单车' }, { intervalMs: 0 }),
    ).rejects.toMatchObject({ code: 30000, message: 'upstream busted' });
  });
});

describe('getClassScheduleOrderCode', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求 getOrderCode 路径，并带上 scheduleId 和 scheduleIdSk', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: { codeUrl: 'https://img.example.com/code.png' },
      },
    });

    const result = await getClassScheduleOrderCode({
      scheduleId: 1445941891,
      scheduleIdSk: 'd3ac6ed0',
    });

    expect(post).toHaveBeenCalledWith('/class-schedules/getOrderCode', {
      scheduleId: 1445941891,
      scheduleIdSk: 'd3ac6ed0',
    });
    expect(result).toEqual({ codeUrl: 'https://img.example.com/code.png' });
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 40004, msg: 'schedule not found', data: { codeUrl: '' } },
    });

    await expect(
      getClassScheduleOrderCode({ scheduleId: 1, scheduleIdSk: 'sk' }),
    ).rejects.toMatchObject({ code: 40004, message: 'schedule not found' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { z } from 'zod';
import { searchClassCourses } from '../api.js';
import { getHttpClient } from '@/shared/http/client.js';
import type { ClassCourse } from '../schema.js';

vi.mock('../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

type RawClassCourse = z.input<typeof ClassCourse>;

function course(overrides: Partial<RawClassCourse> = {}): RawClassCourse {
  return {
    classId: 101,
    className: '莱美 BODYPUMP',
    classIntroduce: '一节经典的杠铃操课程',
    trainingEffect: '全身肌耐力训练',
    suitablePeople: '想要塑形的人群',
    faq: '需要自带装备吗？不需要。',
    note: '请提前 10 分钟到店',
    ...overrides,
  };
}

describe('searchClassCourses', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求 /class-courses/search，请求体携带 keyword 字段', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [course()] } },
    });

    await searchClassCourses({ keyword: '莱美' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/class-courses/search', {
      keyword: '莱美',
    });
  });

  it('成功时返回 data.list', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          list: [course({ classId: 1 }), course({ classId: 2 })],
        },
      },
    });

    const result = await searchClassCourses({ keyword: '团课' });

    expect(result.list.map((c) => c.classId)).toEqual([1, 2]);
  });

  it('上游返回空列表时同样以成功信封返回空数组', async () => {
    post.mockResolvedValueOnce({
      data: { code: 0, msg: 'success', data: { list: [] } },
    });

    const result = await searchClassCourses({ keyword: '不存在的课程' });

    expect(result).toEqual({ list: [] });
  });

  it('上游信封 code 非 0 时抛出 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 30000, msg: 'upstream busted', data: { list: [] } },
    });

    await expect(
      searchClassCourses({ keyword: '莱美' }),
    ).rejects.toMatchObject({
      code: 30000,
      message: 'upstream busted',
    });
  });
});

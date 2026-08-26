import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPersonalTrainingDetail, listTrainingRecords } from '../api.js';
import { getHttpClient } from '@/shared/http/client.js';
import { debug } from '@/shared/logger.js';
import type { ApiTrainingRecord } from '../schema.js';

vi.mock('../../../shared/http/client.js', () => ({
  getHttpClient: vi.fn(),
}));

vi.mock('../../../shared/logger.js', () => ({
  debug: vi.fn(),
}));

function record(overrides: Partial<ApiTrainingRecord> = {}): ApiTrainingRecord {
  return {
    boxName: '留仙洞T33全时中心综合训练店',
    className: '精准塑形-臀腿',
    trainingId: 1445941891,
    orderType: 1,
    orderId: 'order-1445941891',
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
    vi.mocked(debug).mockReset();
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

describe('查询私教训练详情', () => {
  const post = vi.fn();

  beforeEach(() => {
    post.mockReset();
    vi.mocked(getHttpClient).mockReturnValue({ post } as never);
  });

  it('以 POST 方式请求私教详情路径并透传输入参数', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          startTime: null,
          endTime: null,
          boxName: null,
          trainerStageName: null,
          photo: null,
          plan: {
            planId: null,
            title: null,
            image: null,
            trainingTotalNum: null,
            trainingStage: null,
            finishTrainingCount: null,
          },
          bodyPartMap: null,
          moduleList: null,
        },
      },
    });

    const result = await getPersonalTrainingDetail({
      orderType: 99,
      trainingId: 1445941891,
      orderId: '9527',
    });

    expect(post).toHaveBeenCalledWith('/training-records/queryPersonalDetail', {
      orderType: 99,
      trainingId: 1445941891,
      orderId: '9527',
    });
    expect(result.plan.planId).toBeNull();
  });

  it('未传 orderId 时请求体不包含该字段', async () => {
    post.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'success',
        data: {
          startTime: null,
          endTime: null,
          boxName: null,
          trainerStageName: null,
          photo: null,
          plan: {
            planId: null,
            title: null,
            image: null,
            trainingTotalNum: null,
            trainingStage: null,
            finishTrainingCount: null,
          },
          bodyPartMap: null,
          moduleList: null,
        },
      },
    });

    await getPersonalTrainingDetail({ orderType: 6, trainingId: 1 });

    expect(post.mock.calls[0]?.[1]).not.toHaveProperty('orderId');
  });

  it('直接透传 data，不校验嵌套字段', async () => {
    const data = {
      moduleList: [{ loadList: [{ duration: '接口可透传任意类型' }] }],
      extraField: true,
    };
    post.mockResolvedValueOnce({ data: { code: 0, msg: 'success', data } });

    await expect(
      getPersonalTrainingDetail({ orderType: 20, trainingId: 25041571 }),
    ).resolves.toEqual(data);
  });

  it('记录请求参数和接口原始响应以便排查响应结构', async () => {
    const response = {
      status: 200,
      data: {
        code: 0,
        msg: 'success',
        data: {
          startTime: null,
          endTime: null,
          boxName: null,
          trainerStageName: null,
          photo: null,
          plan: {
            planId: null,
            title: null,
            image: null,
            trainingTotalNum: null,
            trainingStage: null,
            finishTrainingCount: null,
          },
          bodyPartMap: null,
          moduleList: null,
        },
      },
    };
    post.mockResolvedValueOnce(response);

    await getPersonalTrainingDetail({ orderType: 20, trainingId: 25041571 });

    expect(debug).toHaveBeenCalledWith('请求', {
      method: 'POST',
      path: '/training-records/queryPersonalDetail',
      body: { orderType: 20, trainingId: 25041571 },
    });
    expect(debug).toHaveBeenCalledWith('接口原始响应', {
      path: '/training-records/queryPersonalDetail',
      status: 200,
      data: response.data,
    });
  });

  it('响应信封校验失败时记录校验阶段和完整字段路径', async () => {
    post.mockResolvedValueOnce({
      status: 200,
      data: { code: '0', msg: 'success', data: {} },
    });

    await expect(
      getPersonalTrainingDetail({ orderType: 20, trainingId: 25041571 }),
    ).rejects.toThrow();

    expect(debug).toHaveBeenCalledWith(
      '响应校验失败',
      expect.objectContaining({
        stage: 'envelope',
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ['code'], message: expect.any(String) }),
        ]),
      }),
    );
  });

  it('上游信封 code 非 0 时透传 CliError', async () => {
    post.mockResolvedValueOnce({
      data: { code: 502, msg: 'training detail service unavailable' },
    });

    await expect(getPersonalTrainingDetail({ orderType: 6, trainingId: 1 })).rejects.toMatchObject({
      code: 502,
      message: 'training detail service unavailable',
    });
  });
});

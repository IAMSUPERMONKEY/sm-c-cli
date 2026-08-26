import { describe, expect, it } from 'vitest';
import {
  ListEnvelope,
  ListInput,
  ListResult,
  PersonalDetailEnvelope,
  PersonalDetailInput,
} from '../schema.js';

describe('运动记录列表参数', () => {
  it('接受 YYYY-MM 格式的年月', () => {
    expect(ListInput.parse({ yearMonth: '2026-07' })).toEqual({
      yearMonth: '2026-07',
    });
  });

  it('缺少年月时报错', () => {
    expect(() => ListInput.parse({})).toThrow(/--year-month/);
  });

  it.each(['2026-7', '2026/07', '26-07', '2026-13', '2026-00'])('拒绝无效年月 %s', (yearMonth) => {
    expect(() => ListInput.parse({ yearMonth })).toThrow(/YYYY-MM/);
  });
});

describe('运动记录列表响应', () => {
  it('接受后端返回的数字运动类型', () => {
    const result = ListEnvelope.parse({
      code: 0,
      data: {
        list: [
          {
            trainingId: 1445941891,
            orderType: 1,
            orderId: 'order-1445941891',
            boxName: '留仙洞T33全时中心综合训练店',
            className: '精准塑形-臀腿',
            startTime: '2026-07-15 20:30:00',
            endTime: '2026-07-15 21:30:00',
            trainerStageName: '明天',
            checkin: 1,
            trainingType: 5,
          },
        ],
      },
      msg: 'success',
    });

    expect(result.data.list[0]).toMatchObject({
      trainingId: 1445941891,
      orderType: 1,
      orderId: 'order-1445941891',
      trainerStageName: '明天',
      trainingType: 5,
    });
  });

  it('要求返回订单类型，订单 id 可缺省', () => {
    const record = {
      trainingId: 1445941891,
      boxName: '留仙洞T33全时中心综合训练店',
      className: '精准塑形-臀腿',
      startTime: '2026-07-15 20:30:00',
      endTime: '2026-07-15 21:30:00',
      trainerStageName: '明天',
      checkin: 1,
      trainingType: 5,
    };

    expect(() =>
      ListEnvelope.parse({ code: 0, data: { list: [record] }, msg: 'success' }),
    ).toThrow();
    const parsedRecord = ListEnvelope.parse({
      code: 0,
      data: { list: [{ ...record, orderType: 1 }] },
      msg: 'success',
    }).data.list[0];

    expect(parsedRecord).toMatchObject({ orderType: 1 });
    expect(parsedRecord).not.toHaveProperty('orderId');
    expect(() =>
      ListEnvelope.parse({
        code: 0,
        data: { list: [{ ...record, orderType: 1.5 }] },
        msg: 'success',
      }),
    ).toThrow();
  });

  it('CLI 输出接受字符串运动类型和签到状态', () => {
    const result = ListResult.parse({
      list: [
        {
          trainingId: 1445941891,
          orderType: 1,
          orderId: 'order-1445941891',
          boxName: '留仙洞T33全时中心综合训练店',
          className: '精准塑形-臀腿',
          startTime: '2026-07-15 20:30:00',
          endTime: '2026-07-15 21:30:00',
          trainerStageName: '明天',
          checkin: '已签到',
          trainingType: 'SGO',
        },
      ],
    });

    expect(result.list[0]).toMatchObject({
      trainingType: 'SGO',
      checkin: '已签到',
    });
  });
});

describe('私教训练详情参数', () => {
  it('把任意数字形式的 orderType 和字符串 trainingId 转换为数字', () => {
    expect(
      PersonalDetailInput.parse({
        orderType: '99',
        trainingId: '1445941891',
        orderId: '9527',
      }),
    ).toEqual({ orderType: 99, trainingId: 1445941891, orderId: '9527' });
  });

  it('orderType 不是数字时报错', () => {
    expect(() => PersonalDetailInput.parse({ orderType: 'private', trainingId: '1' })).toThrow(
      /--order-type/,
    );
  });

  it('trainingId 不是正整数时报错', () => {
    expect(() => PersonalDetailInput.parse({ orderType: '6', trainingId: '0' })).toThrow(
      /--training-id/,
    );
  });

  it('orderId 不是正整数字符串时报错', () => {
    expect(() =>
      PersonalDetailInput.parse({ orderType: '6', trainingId: '1', orderId: 'order-1' }),
    ).toThrow(/--order-id/);
  });
});

describe('私教训练详情响应', () => {
  it('只校验响应信封，不校验 data 的内容', () => {
    const data = {
      moduleList: [{ loadList: [{ duration: '接口可透传任意类型' }] }],
      extraField: true,
    };

    const result = PersonalDetailEnvelope.parse({ code: 0, msg: 'success', data });

    expect(result.data).toEqual(data);
  });

  it('接受包含空字段和嵌套训练模块的详情', () => {
    const result = PersonalDetailEnvelope.parse({
      code: 0,
      msg: 'success',
      data: {
        startTime: '2026-08-25 10:00:00',
        endTime: null,
        boxName: '超级猩猩测试店',
        trainerStageName: '教练甲',
        photo: null,
        plan: {
          planId: 1,
          title: '力量训练',
          image: null,
          trainingTotalNum: 1200,
          trainingStage: 2,
          finishTrainingCount: 3,
        },
        bodyPartMap: { 背部: 'high' },
        moduleList: [
          {
            moduleName: '主训练',
            dataOrder: 1,
            required: 1,
            disabled: 0,
            trainingTotalNum: 1200,
            duration: 1800,
            loadList: [
              {
                loadType: 'Vertical',
                orgType: '站点训练',
                groupName: '硬拉',
                required: 1,
                disabled: 0,
                dataOrder: 1,
                showOrder: 1,
                duration: null,
                durationShow: 0,
                trainingType: 1,
                actionMotionList: [
                  {
                    oneUnit: '次',
                    rmUnit: 'kg',
                    required: 1,
                    dataOrder: 1,
                    showOrder: 1,
                    description: null,
                    motion: {
                      motionId: 10,
                      motionName: '硬拉',
                      image: null,
                      rhythm: null,
                      unit: '次',
                      rootId: 2,
                      description: null,
                    },
                    actionList: [
                      {
                        linkId: null,
                        dataOrder: 1,
                        required: 1,
                        rm: '60',
                        interval: '60-90',
                        times: '8',
                        second: null,
                        step: null,
                        alternate: 0,
                        checked: 1,
                      },
                    ],
                    actionMotionTagList: [{ tagType: 'newRecord' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(result.data.moduleList?.[0]?.loadList?.[0]?.groupName).toBe('硬拉');
  });
});

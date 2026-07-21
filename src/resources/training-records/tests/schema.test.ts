import { describe, expect, it } from 'vitest';
import { ListEnvelope, ListInput } from '../schema.js';

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
  it('接受最新接口定义中的训练记录字段', () => {
    const result = ListEnvelope.parse({
      code: 0,
      data: {
        list: [
          {
            trainingId: 1445941891,
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
      trainerStageName: '明天',
      trainingType: 5,
    });
  });
});

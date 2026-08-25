import { describe, expect, it } from 'vitest';
import { mapTrainingRecordLabels } from '../list.js';
import type { ApiTrainingRecord } from '../schema.js';

function record(
  trainingId: number,
  trainingType: ApiTrainingRecord['trainingType'],
  checkin: ApiTrainingRecord['checkin'] = 1,
): ApiTrainingRecord {
  return {
    trainingId,
    orderType: 1,
    orderId: `order-${trainingId}`,
    boxName: '留仙洞T33全时中心综合训练店',
    className: '精准塑形-臀腿',
    startTime: '2026-07-15 20:30:00',
    endTime: '2026-07-15 21:30:00',
    trainerStageName: '明天',
    checkin,
    trainingType,
  };
}

describe('运动记录展示字段映射', () => {
  it('把后端数字类型和签到状态映射为字符串说明', () => {
    const result = mapTrainingRecordLabels({
      list: [record(1, 1, 0), record(2, 2), record(3, 3), record(4, 4), record(5, 5)],
    });

    expect(result.list.map((item) => item.trainingType)).toEqual([
      '团体课',
      '训练营',
      '私教',
      '甄选商品',
      'SGO',
    ]);
    expect(result.list.map((item) => item.checkin)).toEqual([
      '未签到',
      '已签到',
      '已签到',
      '已签到',
      '已签到',
    ]);
    expect(result.list[0]).toMatchObject({ orderType: 1, orderId: 'order-1' });
  });
});

import { z } from 'zod';

export const ListInput = z.object({
  yearMonth: z
    .string({ message: '--year-month 为必填参数' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
      message: '--year-month 必须是 YYYY-MM 格式',
    })
    .describe('查询年月'),
});
export type ListInput = z.infer<typeof ListInput>;

export const TrainingRecord = z.object({
  trainingId: z.number().describe('训练记录 id'),
  boxName: z.string().describe('门店名称'),
  className: z.string().describe('课程名称'),
  startTime: z.string().describe('课表开始时间'),
  endTime: z.string().describe('课表结束时间'),
  trainerStageName: z.string().describe('教练昵称'),
  checkin: z.union([z.literal(0), z.literal(1)]).describe('签到状态'),
  trainingType: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .describe('运动类型'),
});
export type TrainingRecord = z.infer<typeof TrainingRecord>;

export const ListData = z.object({
  list: z.array(TrainingRecord).describe('运动记录列表'),
});
export type ListData = z.infer<typeof ListData>;

export const ListEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: ListData,
  msg: z.string().describe('消息'),
});
export type ListEnvelope = z.infer<typeof ListEnvelope>;

export const ListResult = ListData;
export type ListResult = z.infer<typeof ListResult>;

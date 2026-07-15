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
  classId: z.number().int().describe('课程 id'),
  className: z.string().describe('课程名称'),
  boxId: z.number().int().describe('门店 id'),
  boxIdSk: z.string().describe('门店 id 验证码'),
  scheduleDate: z.string().describe('课表日期'),
  startTime: z.string().describe('课表开始时间'),
  endTime: z.string().describe('课表结束时间'),
  face: z.string().describe('教练头像地址'),
  scheduleId: z.number().describe('课表 id'),
  scheduleIdSk: z.string().describe('课表 id 验证'),
  trainerName: z.string().describe('教练昵称'),
  trainerUserId: z.number().int().describe('教练 id'),
  trainerUserIdSk: z.string().describe('教练 id 验证码'),
  boxName: z.string().describe('门店名称'),
  nonStart: z.union([z.literal(0), z.literal(1)]).describe('未开课状态'),
  checkin: z.union([z.literal(0), z.literal(1)]).describe('签到状态'),
  isWait: z.number().int().describe('是否等候中'),
  trainingType: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
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

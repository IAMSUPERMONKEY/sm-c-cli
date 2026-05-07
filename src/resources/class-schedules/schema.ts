import { z } from 'zod';

export const SearchInput = z.object({
  city: z.string().min(1, '--city is required').describe('城市'),
  keyword: z.string().min(1, '--keyword is required').describe('关键词'),
  date: z.string().optional().describe('日期'),
});
export type SearchInput = z.infer<typeof SearchInput>;

export const ClassSchedule = z.object({
  boxId: z.number().describe('门店 id'),
  boxIdSk: z.string(),
  boxName: z.string().describe('门店名称'),
  classId: z.number().describe('课程 id'),
  className: z.string().describe('课程'),
  endTime: z.string().describe('课表结束时间'),
  face: z.string().describe('教练头像'),
  price: z.number().describe('价格'),
  scheduleDate: z.string().describe('课表日期'),
  scheduleId: z.number().describe('课表 id'),
  scheduleIdSk: z.string(),
  startTime: z.string().describe('课表开始时间'),
  trainerName: z.string().describe('教练昵称'),
  trainerUserId: z.number().describe('教练 id'),
  trainerUserIdSk: z.string(),
});
export type ClassSchedule = z.infer<typeof ClassSchedule>;

export const SearchPageData = z.object({
  list: z.array(ClassSchedule).describe('课表列表'),
  limit: z.number().describe('本次分页最大条数'),
  offset: z.number().describe('本次分页跳过条数'),
  totalHits: z.number().describe('总条数'),
});
export type SearchPageData = z.infer<typeof SearchPageData>;

export const SearchPageEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: SearchPageData,
  msg: z.string().describe('消息'),
});
export type SearchPageEnvelope = z.infer<typeof SearchPageEnvelope>;

export const SearchResult = z.object({
  list: z.array(ClassSchedule).describe('课表列表'),
});
export type SearchResult = z.infer<typeof SearchResult>;

export const OrderInput = z.object({
  scheduleId: z
    .union([z.string(), z.number()])
    .transform((v, ctx) => {
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '--schedule-id must be a positive integer',
        });
        return z.NEVER;
      }
      return n;
    })
    .describe('课表 id'),
  scheduleIdSk: z
    .string()
    .min(1, '--schedule-id-sk is required')
    .describe('课表 id 验证'),
});
export type OrderInput = z.infer<typeof OrderInput>;

export const OrderResult = z.object({
  codeUrl: z.string().describe('预约小程序码图片地址'),
});
export type OrderResult = z.infer<typeof OrderResult>;

export const OrderEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: OrderResult,
  msg: z.string().describe('消息'),
});
export type OrderEnvelope = z.infer<typeof OrderEnvelope>;

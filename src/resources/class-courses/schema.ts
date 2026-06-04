import { z } from 'zod';

const nonEmptyString = (label: string) =>
  z
    .string({ message: `${label} is required` })
    .min(1, { message: `${label} is required` });

export const SearchInput = z.object({
  keyword: nonEmptyString('--keyword').describe('查询关键词'),
});
export type SearchInput = z.infer<typeof SearchInput>;

export const ClassCourse = z.object({
  classId: z.number().describe('课程ID'),
  className: z.string().describe('课程名称'),
  classIntroduce: z.string().describe('课程简介'),
  trainingEffect: z.string().describe('训练功效'),
  suitablePeople: z.string().describe('适合人群'),
  faq: z.string().describe('常见问题'),
  note: z.string().describe('注意事项'),
});
export type ClassCourse = z.infer<typeof ClassCourse>;

export const SearchData = z.object({
  list: z.array(ClassCourse).describe('课程列表'),
});
export type SearchData = z.infer<typeof SearchData>;

export const SearchEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: SearchData,
  msg: z.string().describe('消息'),
});
export type SearchEnvelope = z.infer<typeof SearchEnvelope>;

export const SearchResult = SearchData;
export type SearchResult = z.infer<typeof SearchResult>;

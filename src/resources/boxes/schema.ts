import { z } from 'zod';

export const BoxBizType = z.enum(['class']).describe('业态');
export type BoxBizType = z.infer<typeof BoxBizType>;

const nonEmptyString = (label: string) =>
  z
    .string({ message: `${label} is required` })
    .min(1, { message: `${label} is required` });

export const SearchInput = z.object({
  longitude: nonEmptyString('--longitude').describe('经度'),
  latitude: nonEmptyString('--latitude').describe('纬度'),
});
export type SearchInput = z.infer<typeof SearchInput>;

export const SearchByKeywordInput = z.object({
  keyword: nonEmptyString('--keyword').describe('关键字'),
});
export type SearchByKeywordInput = z.infer<typeof SearchByKeywordInput>;

export const Box = z.object({
  boxId: z.number().describe('门店 id'),
  boxIdSk: z.string(),
  boxName: z.string().describe('门店'),
  city: z.string().describe('城市'),
  area: z.string().describe('区域'),
  address: z.string().describe('地址'),
  addressGuide: z.string().describe('到店指引'),
  distance: z.number().transform(formatDistance).describe('距离'),
  type: BoxBizType.describe('业态'),
});
export type Box = z.infer<typeof Box>;

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '-';
  if (meters < 1000) return `${roundTo1Decimal(meters)}m`;
  return `${roundTo1Decimal(meters / 1000)}km`;
}

function roundTo1Decimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export const SearchData = z.object({
  list: z.array(Box).describe('门店列表'),
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

export const BoxByKeyword = z.object({
  boxId: z.number().describe('门店 id'),
  boxIdSk: z.string(),
  brandName: z.string().describe('品牌'),
  boxName: z.string().describe('门店'),
  city: z.string().describe('城市'),
  district: z.string().describe('区域'),
  address: z.string().describe('地址'),
  addressGuide: z.string().describe('到店指引'),
});
export type BoxByKeyword = z.infer<typeof BoxByKeyword>;

export const SearchByKeywordData = z.object({
  list: z.array(BoxByKeyword).describe('门店列表'),
});
export type SearchByKeywordData = z.infer<typeof SearchByKeywordData>;

export const SearchByKeywordEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: SearchByKeywordData,
  msg: z.string().describe('消息'),
});
export type SearchByKeywordEnvelope = z.infer<typeof SearchByKeywordEnvelope>;

export const SearchByKeywordResult = SearchByKeywordData;
export type SearchByKeywordResult = z.infer<typeof SearchByKeywordResult>;

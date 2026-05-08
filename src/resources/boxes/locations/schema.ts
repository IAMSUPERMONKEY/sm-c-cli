import { z } from 'zod';

const nonEmptyString = (label: string) =>
  z
    .string({ message: `${label} is required` })
    .min(1, { message: `${label} is required` });

export const LocationsSearchInput = z.object({
  keyword: nonEmptyString('--keyword').describe('地理位置描述'),
});
export type LocationsSearchInput = z.infer<typeof LocationsSearchInput>;

export const Location = z.object({
  address: z.string().describe('地址'),
  country: z.string().describe('国家'),
  province: z.string().describe('省份'),
  city: z.string().describe('城市'),
  district: z.string().describe('区域'),
  longitude: z.string().describe('经度'),
  latitude: z.string().describe('纬度'),
});
export type Location = z.infer<typeof Location>;

export const LocationsSearchData = z.object({
  list: z.array(Location).describe('候选地址列表'),
});
export type LocationsSearchData = z.infer<typeof LocationsSearchData>;

export const LocationsSearchEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: LocationsSearchData,
  msg: z.string().describe('消息'),
});
export type LocationsSearchEnvelope = z.infer<typeof LocationsSearchEnvelope>;

export const LocationsSearchResult = LocationsSearchData;
export type LocationsSearchResult = z.infer<typeof LocationsSearchResult>;

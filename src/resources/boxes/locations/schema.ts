import { z } from 'zod';

const nonEmptyString = (label: string) =>
  z
    .string({ message: `${label} is required` })
    .min(1, { message: `${label} is required` });

export const GeocodeInput = z.object({
  keyword: nonEmptyString('--keyword').describe('地理位置描述'),
});
export type GeocodeInput = z.infer<typeof GeocodeInput>;

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

export const GeocodeData = z.object({
  list: z.array(Location).describe('候选地址列表'),
});
export type GeocodeData = z.infer<typeof GeocodeData>;

export const GeocodeEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: GeocodeData,
  msg: z.string().describe('消息'),
});
export type GeocodeEnvelope = z.infer<typeof GeocodeEnvelope>;

export const GeocodeResult = GeocodeData;
export type GeocodeResult = z.infer<typeof GeocodeResult>;

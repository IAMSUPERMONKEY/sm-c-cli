import { z } from 'zod';

export const BoxBizType = z.enum(['class']).describe('业态');
export type BoxBizType = z.infer<typeof BoxBizType>;

const numberLike = (label: string) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must be a number`,
      });
      return z.NEVER;
    }
    return n;
  });

export const SearchInput = z
  .object({
    lng: numberLike('--lng').optional().describe('经度'),
    lat: numberLike('--lat').optional().describe('纬度'),
    location: z.string().optional().describe('地理位置描述'),
    type: BoxBizType.optional().describe('业态过滤'),
  })
  .superRefine((val, ctx) => {
    const hasLng = val.lng !== undefined;
    const hasLat = val.lat !== undefined;

    if (hasLng !== hasLat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--lng and --lat must be provided together',
      });
      return;
    }

    if (!hasLng && (val.location === undefined || val.location === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'either --lng/--lat or --location is required',
      });
      return;
    }

    if (hasLng) {
      if (val.lng! < -180 || val.lng! > 180) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '--lng must be between -180 and 180',
        });
      }
      if (val.lat! < -90 || val.lat! > 90) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '--lat must be between -90 and 90',
        });
      }
    }
  });
export type SearchInput = z.infer<typeof SearchInput>;

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

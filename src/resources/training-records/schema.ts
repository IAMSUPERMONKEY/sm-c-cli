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

function numberInput(flag: string) {
  return z.union([z.string(), z.number()]).transform((value, ctx) => {
    const number = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${flag} 必须是数字`,
      });
      return z.NEVER;
    }
    return number;
  });
}

export const PersonalDetailInput = z.object({
  orderType: numberInput('--order-type').describe('私教订单类型'),
  trainingId: z
    .union([z.string(), z.number()])
    .transform((value, ctx) => {
      const number = typeof value === 'number' ? value : Number(value);
      if (!Number.isInteger(number) || number <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '--training-id 必须是正整数',
        });
        return z.NEVER;
      }
      return number;
    })
    .describe('训练 ID'),
  orderId: z
    .string()
    .regex(/^[1-9][0-9]*$/, '--order-id 必须是正整数字符串')
    .optional()
    .describe('订单 ID'),
});
export type PersonalDetailInput = z.infer<typeof PersonalDetailInput>;

const NullableString = z.string().nullable();
const NullableInteger = z.number().int().nullable();

const PersonalTrainingAction = z.object({
  linkId: NullableInteger.describe('同组下一个节点的数组索引 ID'),
  dataOrder: NullableInteger.describe('练习组排序值'),
  required: NullableInteger.describe('是否必须'),
  rm: NullableString.describe('负荷重量，单位 kg'),
  interval: NullableString.describe('组间歇时长，单位秒'),
  times: NullableString.describe('按次数计量的目标值'),
  second: NullableString.describe('按秒计量的目标值'),
  step: NullableString.describe('按步数计量的目标值'),
  alternate: NullableInteger.describe('是否交替训练'),
  checked: NullableInteger.describe('是否勾选'),
});

const PersonalTrainingMotion = z.object({
  motionId: NullableInteger.describe('动作 ID'),
  motionName: NullableString.describe('动作名称'),
  image: NullableString.describe('动作图片 URL'),
  rhythm: NullableString.describe('动作节奏'),
  unit: NullableString.describe('动作计量单位'),
  rootId: NullableInteger.describe('动作根分类 ID'),
  description: NullableString.describe('动作教学规范等说明'),
});

const PersonalTrainingActionMotion = z.object({
  oneUnit: NullableString.describe('动作练习组统一单位'),
  rmUnit: NullableString.describe('负荷单位'),
  required: NullableInteger.describe('是否必须'),
  dataOrder: NullableInteger.describe('动作练习组排序值'),
  showOrder: NullableInteger.describe('动作练习组展示排序值'),
  description: NullableString.describe('动作练习组描述'),
  motion: PersonalTrainingMotion.nullable().describe('动作信息'),
  actionList: z.array(PersonalTrainingAction).nullable().describe('练习组明细列表'),
  actionMotionTagList: z
    .array(z.object({ tagType: NullableString.describe('标签类型') }))
    .nullable()
    .describe('动作练习组标签列表'),
});

const PersonalTrainingLoad = z.object({
  loadType: NullableString.describe('负载类型'),
  orgType: NullableString.describe('训练组织形式'),
  groupName: NullableString.describe('负载组名称'),
  required: NullableInteger.describe('是否必须'),
  disabled: NullableInteger.describe('是否禁用'),
  dataOrder: NullableInteger.describe('负载组排序值'),
  showOrder: NullableInteger.describe('负载组展示排序值'),
  duration: NullableInteger.describe('负载组持续时间，单位秒'),
  durationShow: NullableInteger.describe('是否展示负载组持续时间'),
  trainingType: NullableInteger.describe('训练形式'),
  actionMotionList: z.array(PersonalTrainingActionMotion).nullable().describe('动作练习组列表'),
});

const PersonalTrainingModule = z.object({
  moduleName: NullableString.describe('模块名称'),
  dataOrder: NullableInteger.describe('模块排序值'),
  loadList: z.array(PersonalTrainingLoad).nullable().describe('负载组列表'),
  required: NullableInteger.describe('是否必须'),
  disabled: NullableInteger.describe('是否禁用'),
  trainingTotalNum: NullableInteger.describe('模块训练总量'),
  duration: NullableInteger.describe('模块持续时间，单位秒'),
});

export const PersonalDetailResult = z.object({
  startTime: NullableString.describe('训练开始时间'),
  endTime: NullableString.describe('训练结束时间'),
  boxName: NullableString.describe('门店名称'),
  trainerStageName: NullableString.describe('教练昵称'),
  photo: NullableString.describe('课程合照 URL'),
  plan: z.object({
    planId: NullableInteger.describe('训练计划 ID'),
    title: NullableString.describe('训练计划标题'),
    image: NullableString.describe('训练计划图片 URL'),
    trainingTotalNum: NullableInteger.describe('训练总量，单位 kg'),
    trainingStage: NullableInteger.describe('训练阶段'),
    finishTrainingCount: NullableInteger.describe('已完成训练次数'),
  }),
  bodyPartMap: z.record(z.string(), NullableString).nullable().describe('训练部位强度映射'),
  moduleList: z.array(PersonalTrainingModule).nullable().describe('训练模块列表'),
});
export type PersonalDetailResult = z.infer<typeof PersonalDetailResult>;

export const PersonalDetailEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: z.custom<PersonalDetailResult>().optional().describe('私教训练详情'),
  msg: z.string().describe('消息'),
});
export type PersonalDetailEnvelope = z.infer<typeof PersonalDetailEnvelope>;

const TrainingRecordBase = z.object({
  trainingId: z.number().describe('训练记录 id'),
  orderType: z.number().int().describe('订单类型'),
  orderId: z.string().optional().describe('订单 id'),
  boxName: z.string().describe('门店名称'),
  className: z.string().describe('课程名称'),
  startTime: z.string().describe('课表开始时间'),
  endTime: z.string().describe('课表结束时间'),
  trainerStageName: z.string().describe('教练昵称'),
});

export const ApiTrainingRecord = TrainingRecordBase.extend({
  checkin: z.union([z.literal(0), z.literal(1)]).describe('签到状态'),
  trainingType: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .describe('运动类型'),
});
export type ApiTrainingRecord = z.infer<typeof ApiTrainingRecord>;

export const TrainingRecord = TrainingRecordBase.extend({
  checkin: z.string().describe('签到状态'),
  trainingType: z.string().describe('运动类型'),
});
export type TrainingRecord = z.infer<typeof TrainingRecord>;

export const ApiListData = z.object({
  list: z.array(ApiTrainingRecord).describe('运动记录列表'),
});
export type ApiListData = z.infer<typeof ApiListData>;

export const ListData = z.object({
  list: z.array(TrainingRecord).describe('运动记录列表'),
});
export type ListData = z.infer<typeof ListData>;

export const ListEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: ApiListData,
  msg: z.string().describe('消息'),
});
export type ListEnvelope = z.infer<typeof ListEnvelope>;

export const ListResult = ListData;
export type ListResult = z.infer<typeof ListResult>;

export const ApiListResult = ApiListData;
export type ApiListResult = z.infer<typeof ApiListResult>;

# 私教训练详情返回结构说明

本文用于帮助 agent 理解 `training-records +personal-detail` 返回的私教训练详情，并准确解释训练计划、训练模块和动作训练安排。

本文重点解释成功响应的 `data`。命令调用门禁、参数来源和通用错误处理以同级 `SKILL.md` 为准。

## 1. 响应整体结构

成功响应使用 `{ code, data, msg }` 信封：

```json
{
  "code": 0,
  "data": {
    "startTime": "2026-08-25 10:00:00",
    "endTime": "2026-08-25 11:00:00",
    "boxName": "门店名称",
    "trainerStageName": "教练昵称",
    "photo": null,
    "plan": {},
    "bodyPartMap": {},
    "moduleList": []
  },
  "msg": "success"
}
```

顶层字段：

| 字段   | 类型      | 含义                           |
| ------ | --------- | ------------------------------ |
| `code` | `integer` | 业务返回码；成功固定为 `0`     |
| `data` | `object`  | 私教训练详情                   |
| `msg`  | `string`  | 业务提示；成功固定为 `success` |

`data` 可分为三部分：

1. 本次训练信息：时间、门店、教练、课程合照。
2. 训练计划概览：计划标题、总容量、训练阶段、累计完成次数和训练部位。
3. 训练计划内容：模块、负载组、动作训练项和训练参数明细。

`data` 中训练计划相关字段的实际层级：

```text
data
├── plan                              训练计划概览
├── bodyPartMap                       训练部位强度
└── moduleList[]                      训练模块
    └── loadList[]                    负载组
        └── actionMotionList[]         动作训练项
            ├── motion                动作信息
            └── actionList[]          训练参数明细
```

## 2. 本次训练信息

| 字段               | 类型             | 含义                                               |
| ------------------ | ---------------- | -------------------------------------------------- |
| `startTime`        | `string \| null` | 训练开始时间，格式为上海时区 `YYYY-MM-DD HH:mm:ss` |
| `endTime`          | `string \| null` | 训练结束时间，格式同上                             |
| `boxName`          | `string \| null` | 上课门店名称                                       |
| `trainerStageName` | `string \| null` | 教练昵称；字段名中的 `Stage` 不表示训练阶段        |
| `photo`            | `string \| null` | 课程合照 URL                                       |

时间字段已经转换为上海时区的日期时间字符串，不应再按毫秒时间戳解析或重复进行时区转换。

## 3. `plan`：训练计划概览

`plan` 必定是对象，但对象内的字段都可能为 `null`。

| 字段                  | 类型              | 含义                |
| --------------------- | ----------------- | ------------------- |
| `planId`              | `integer \| null` | 训练计划 ID         |
| `title`               | `string \| null`  | 训练计划标题        |
| `image`               | `string \| null`  | 训练计划图片 URL    |
| `trainingTotalNum`    | `integer \| null` | 训练总容量，单位 kg |
| `trainingStage`       | `integer \| null` | 训练阶段编号        |
| `finishTrainingCount` | `integer \| null` | 已完成训练次数      |

解释注意：

- `trainingTotalNum` 表示接口汇总的训练容量。它不是训练时长、动作数量、卡路里或单次最大重量。
- `trainingStage` 只提供阶段编号，接口没有给出各编号对应的阶段名称，不要自行命名。
- `finishTrainingCount` 是累计完成训练的次数，不是本次训练的动作数或组数。

## 4. `bodyPartMap`：训练部位强度

`bodyPartMap` 是“肌群名称 → 训练强度”的映射：

```json
{
  "背部": "high",
  "臀部": "mid",
  "核心": "low"
}
```

已知强度值：

| 值     | 含义     |
| ------ | -------- |
| `low`  | 低强度   |
| `mid`  | 中等强度 |
| `high` | 高强度   |

可以将示例解释为“背部为高强度、臀部为中等强度、核心为低强度”。这些值只表示训练计划中的部位强度，不代表医学诊断、肌肉激活比例或疼痛部位。遇到未知值或 `null` 时，只说明该部位的强度未提供。

## 5. `moduleList`：训练计划内容

`moduleList` 是训练模块数组。模块是训练计划的大阶段，每个模块继续包含一个或多个负载组。

模块名称可能是“热身”“主要练习”“整理”等，但必须以接口实际返回的 `moduleName` 为准，不能根据位置自行补充名称。

### 5.1 训练模块 `moduleList[]`

| 字段               | 类型              | 含义                       |
| ------------------ | ----------------- | -------------------------- |
| `moduleName`       | `string \| null`  | 模块名称                   |
| `dataOrder`        | `integer \| null` | 模块排序值，数值越小越靠前 |
| `loadList`         | `array \| null`   | 模块内的负载组列表         |
| `required`         | `integer \| null` | 是否必须：`0` 否、`1` 是   |
| `disabled`         | `integer \| null` | 是否禁用：`0` 否、`1` 是   |
| `trainingTotalNum` | `integer \| null` | 模块训练容量               |
| `duration`         | `integer \| null` | 模块持续时间，单位秒       |

`trainingTotalNum` 是当前模块的容量，不应与整个计划的 `plan.trainingTotalNum` 混淆。`required` 表示该模块是否为必选内容，不等于用户是否实际完成。

### 5.2 负载组 `loadList[]`

负载组用于组织模块内的一组动作练习。

| 字段               | 类型              | 含义                                                      |
| ------------------ | ----------------- | --------------------------------------------------------- |
| `loadType`         | `string \| null`  | 负载类型：`Horizontal` 水平负载、`Vertical` 垂直负载      |
| `orgType`          | `string \| null`  | 训练组织形式，例如同频训练、站点训练、交替训练            |
| `groupName`        | `string \| null`  | 负载组名称                                                |
| `required`         | `integer \| null` | 是否必须：`0` 否、`1` 是                                  |
| `disabled`         | `integer \| null` | 是否禁用：`0` 否、`1` 是                                  |
| `dataOrder`        | `integer \| null` | 负载组排序值，数值越小越靠前                              |
| `showOrder`        | `integer \| null` | 负载组展示排序值，数值越小越靠前                          |
| `duration`         | `integer \| null` | 负载组持续时间，单位秒                                    |
| `durationShow`     | `integer \| null` | 是否展示负载组持续时间                                    |
| `trainingType`     | `integer \| null` | 训练形式：`1` 常规训练、`2` For time、`3` EMOM、`4` AMRAP |
| `actionMotionList` | `array \| null`   | 负载组内的动作训练项列表                                  |

`loadType` 描述负载编排方向，`orgType` 描述动作的组织方式，`trainingType` 描述训练形式。三者含义不同，不应相互替代。只凭 `loadType` 不能判断它一定属于超级组、循环组或其他具体训练法。

### 5.3 动作训练项 `actionMotionList[]`

动作训练项把动作信息和该动作的训练参数明细关联在一起。

| 字段                  | 类型              | 含义                                 |
| --------------------- | ----------------- | ------------------------------------ |
| `oneUnit`             | `string \| null`  | 动作训练项的统一计量单位             |
| `rmUnit`              | `string \| null`  | 负荷单位，例如 `%` 或 `kg`           |
| `required`            | `integer \| null` | 是否必须：`0` 否、`1` 是             |
| `dataOrder`           | `integer \| null` | 动作训练项排序值，数值越小越靠前     |
| `showOrder`           | `integer \| null` | 动作训练项展示排序值，数值越小越靠前 |
| `description`         | `string \| null`  | 当前动作训练项的说明                 |
| `motion`              | `object \| null`  | 动作信息                             |
| `actionList`          | `array \| null`   | 训练参数明细列表                     |
| `actionMotionTagList` | `array \| null`   | 动作标签列表                         |

`oneUnit` 存在时表示该动作训练项统一使用该单位；为空时可参考 `motion.unit`。`required` 表示该动作训练项是否必选，不等于实际完成状态。

#### `motion`：动作信息

| 字段          | 类型              | 含义               |
| ------------- | ----------------- | ------------------ |
| `motionId`    | `integer \| null` | 动作 ID            |
| `motionName`  | `string \| null`  | 动作名称           |
| `image`       | `string \| null`  | 动作图片 URL       |
| `rhythm`      | `string \| null`  | 动作节奏           |
| `unit`        | `string \| null`  | 动作默认计量单位   |
| `rootId`      | `integer \| null` | 动作根分类 ID      |
| `description` | `string \| null`  | 动作教学规范等说明 |

`actionMotionList[].description` 是当前编排中对动作训练项的补充说明，`motion.description` 是动作本身的教学规范或说明，两者不要混为同一个字段。

#### `actionMotionTagList`：动作标签

数组元素结构：

```json
{
  "tagType": "newMotion"
}
```

当前已知标签：

| `tagType`   | 含义   |
| ----------- | ------ |
| `newMotion` | 新动作 |
| `newRecord` | 新纪录 |

`actionMotionTagList` 是对象数组，不是字符串数组。遇到未知标签时按原值谨慎说明，不要自行定义含义。

### 5.4 训练参数明细 `actionList[]`

`actionList` 中的每个元素是一条训练参数记录，描述重量、次数、时长、步数和间歇等安排。元素之间可能通过 `linkId` 关联，因此不能默认把单个元素等同于一组训练。

| 字段        | 类型              | 含义                               | 示例解释                     |
| ----------- | ----------------- | ---------------------------------- | ---------------------------- |
| `linkId`    | `integer \| null` | 同组下一个节点的数组索引 ID        | 用于关联同一组合内的后续明细 |
| `dataOrder` | `integer \| null` | 训练参数记录排序值，数值越小越靠前 | 通常不需要向用户展示         |
| `required`  | `integer \| null` | 是否必须：`0` 否、`1` 是           | 不代表实际完成状态           |
| `rm`        | `string \| null`  | 负荷重量，单位 kg；`0` 表示自重    | `"60"` → 60 kg，`"0"` → 自重 |
| `interval`  | `string \| null`  | 组间歇时长，单位秒                 | `"60-90"` → 60～90 秒        |
| `times`     | `string \| null`  | 按次数计量的目标值                 | `"12"` → 12 次               |
| `second`    | `string \| null`  | 按秒计量的目标值                   | `"30"` → 30 秒               |
| `step`      | `string \| null`  | 按步数计量的目标值                 | `"20"` → 20 步               |
| `alternate` | `integer \| null` | 是否交替训练的标记                 | 按接口返回值解释             |

通常 `times`、`second`、`step` 只会使用与计量单位匹配的一种。解释时按实际非空字段说“次数 / 秒 / 步”，不要把空字段列入训练内容。

字段值可能是范围。例如：

- `times: "8-12"` 表示每组 8～12 次。
- `rm: "40-50"` 表示负荷 40～50 kg。
- `interval: "60-90"` 表示组间歇 60～90 秒。

不要擅自对范围取平均值。`linkId` 表示明细之间的组合关系，不能简单把 `actionList` 的元素数量直接当作训练组数。

## 6. 解释返回值时的边界

- 只解释接口实际返回的内容，不根据计划标题、动作名称或肌群强度补造训练效果、消耗热量、伤病风险或医学建议。
- 字段为 `null`、数组为空或对象缺失时，可以省略该项或明确说“详情未提供”，不要自动替换为 `0`、“无”或“未完成”。
- `required` 表示相应训练安排是否必选，不代表用户是否实际完成。
- `planId`、`motionId`、`dataOrder`、`showOrder`、`linkId` 等主要用于标识、排序或关联，除非用户要求原始数据，否则通常不需要展示。
- 保持数组的返回顺序；不要在没有明确需求时自行重排模块、负载组、动作训练项或训练参数明细。
- `disabled == 1` 表示相应模块或负载组已禁用。若需要汇总有效训练内容，应排除禁用项；若用户要求原始结构，应保留并注明禁用状态。
- `bodyPartMap` 为空时，不要仅凭动作名称推断部位强度。
- 接口没有提供动作教学说明时，不要生成可能不准确或不安全的动作指导。

## 7. 空值与失败响应

- `code === 0` 表示成功；成功时 `msg` 固定为 `success`。
- `plan` 存在但内部字段为 `null`：说明详情没有提供相应计划字段，不代表请求失败。
- `moduleList == null` 或 `[]`：说明没有返回训练模块，不代表用户没有训练、没有签到或没有完成。
- `bodyPartMap == null` 或 `{}`：说明没有返回训练部位强度。
- `photo == null`：说明没有返回课程合照。
- `motion == null`：说明该动作训练项没有返回动作信息。
- `actionList == null` 或 `[]`：说明该动作训练项没有返回训练参数明细。

接口定义了 HTTP 502 上游服务异常响应：

```json
{
  "code": 502,
  "msg": "training detail service unavailable"
}
```

该错误可能由上游接口调用失败、业务码异常、响应解析失败，或缺少合法训练计划引起。不能仅凭这条错误消息断定用户没有训练计划。

## 8. 快速字段索引

```text
data
├── startTime / endTime               本次训练时间
├── boxName                           门店
├── trainerStageName                  教练昵称
├── photo                              课程合照
├── plan
│   ├── title / image                  计划名称与图片
│   ├── trainingTotalNum               总容量 kg
│   ├── trainingStage                  阶段编号
│   └── finishTrainingCount            累计完成次数
├── bodyPartMap                        肌群 → low/mid/high
└── moduleList[]                       训练模块
    ├── moduleName / trainingTotalNum  模块名称与模块容量
    └── loadList[]                     负载组
        ├── groupName / loadType       组名与负载类型
        ├── orgType / trainingType     组织形式与训练形式
        └── actionMotionList[]          动作训练项
            ├── motion                 动作名称、图片、节奏、说明
            ├── actionMotionTagList    动作标签
            └── actionList[]           次数/秒/步、重量、间歇等训练参数
```

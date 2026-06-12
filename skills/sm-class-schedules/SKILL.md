---
name: sm-class-schedules
description: SUPERMONKEY（超级猩猩）团课课表：提供超级猩猩团课课表的查询/搜索、与获取课表预约链接地址（帮助约课）能力。当用户问"超级猩猩 / 课表"、"xxx 门店明天有什么课"、"xxx 教练这周哪天有课"、"xxx 课程在哪个店能上"、"最近 / 这几天有什么团课"，或者"想约这节课 / 帮我约这节课"时使用。
metadata:
  requires:
    bins: ['sm-c-cli']
  cliHelp: 'sm-c-cli class-schedules --help'
---

# SUPERMONKEY 团课课表

通过 `sm-c-cli class-schedules` 查询 SUPERMONKEY 团课课表，并获取指定课表的预约链接地址。当前提供两个 Shortcut：

- `+search`：按 **城市 + 关键词（门店 / 课程 / 教练，可组合）** 搜索未来 9 天内的课表，可选限定日期。
- `+order`：根据课表 id（`scheduleId` + `scheduleIdSk`）获取该课表的**预约链接地址**。两个字段都来自 `+search` 的返回结果。

## Shortcut：+search（搜索课表）

### 查询窗口（重要）

- **仅支持查询当前时间起 9 天内的课表**，不支持历史课表。
- 如果用户要查的日期早于今天，直接告知"暂不支持查询历史课表"，不要发起请求。
- 如果用户要查的日期超出 9 天窗口，直接告知"仅支持查询未来 9 天内的课表"，不要发起请求。
- 如果用户明确要看「某一天」或「某几天」的课，使用 `--date` 参数**分多次查询**（每次只能传一个日期），再把多次结果**合并后**给用户。

```
sm-c-cli class-schedules +search --city "<城市>" --keyword "<关键词>" [--date "YYYY-MM-DD"]
```

> 所有参数值统一加双引号，避免 shell 把空格 / 中文截断。

参数：

- `--city`（必填）：城市名称，**必须**是超级猩猩业务覆盖到的城市，且使用「\*\*市」格式。
  - 调用前请先读取 [`../sm-boxes/references/cities.md`](../sm-boxes/references/cities.md)，确认城市是否在超级猩猩业务覆盖的范围内。
  - 用户只说「北京 / 上海 / 杭州」等省略「市」的写法时，自动补全为带「市」的形式（北京市 / 上海市 / 杭州市）后再使用。直辖市同样要带「市」，不要写成「北京」「上海」。
  - 用户问的城市不在超猩业务覆盖的范围内，**直接告知"该城市暂无门店"**，不要发起请求。
  - 如果用户没说城市，**先让用户发送当前位置或询问用户城市**，不要猜。
- `--keyword`（必填）：门店名 / 课程名 / 教练名关键词。
  - 支持单个关键词，也支持**多个关键词用空格分隔**，多个关键词之间是「同时满足」的关系。
  - 用户同时给出多个维度（如门店 + 教练、门店 + 课程）时，把它们拼接到同一个 `--keyword` 中，整体加双引号；不要拆成多次调用。
- `--date`（可选）：限定日期，格式 `YYYY-MM-DD`，必须在「今天起 9 天内」。
  - 用户给的是相对日期（"明天 / 后天 / 下周一"）时，按当前日期换算成 `YYYY-MM-DD` 再传。
  - 用户说"最近的课 / 这几天的课"且没指定具体日期时，**不要传** `--date`，让接口返回当前 9 天窗口的全部数据。

### 使用示例

按城市 + 单维度关键词查询：

```
sm-c-cli class-schedules +search --city "上海市" --keyword "<课程名>"
```

按门店 + 教练组合查询：

```
sm-c-cli class-schedules +search --city "上海市" --keyword "<门店名> <教练名>"
```

按门店 + 课程组合查询，并限定日期：

```
sm-c-cli class-schedules +search --city "上海市" --keyword "<门店名> <课程名>" --date "2026-05-08"
```

### 返回字段

stdout 是 `{ code, data, msg }` 信封；成功时 `data.list` 是课表数组。向用户呈现每条课表时，至少包含以下字段：

| 字段                    | 含义            |
| ----------------------- | --------------- |
| `scheduleDate`          | 课表日期        |
| `startTime` / `endTime` | 开始 / 结束时间 |
| `boxName`               | 门店名称        |
| `className`             | 课程名          |
| `trainerName`           | 教练            |
| `price`                 | 价格            |

## Shortcut：+order（获取课表预约链接地址）

```
sm-c-cli class-schedules +order --schedule-id "<scheduleId>" --schedule-id-sk "<scheduleIdSk>"
```

参数：

- `--schedule-id`（必填）：课表 id，正整数。对应 `+search` 返回结果中的 `scheduleId`。
- `--schedule-id-sk`（必填）：课表 id 校验串。对应 `+search` 返回结果中的 `scheduleIdSk`。

> **数据来源约束**：`scheduleId` 与 `scheduleIdSk` 必须来自**同一条** `+search` 返回结果，不要跨课表拼接，也不要让用户手填或自行构造；这两个字段不必展示给用户，由内部从 `+search` 结果中取出后直接传入即可。

### 使用示例

```
sm-c-cli class-schedules +order --schedule-id "1234567" --schedule-id-sk "abcdef..."
```

### 返回字段

stdout 是 `{ code, data, msg }` 信封；成功时 `data.codeUrl` 是该课表的预约链接地址。把 `codeUrl` 以超链接形式发送给用户，并告知用户点击链接可约课。

## 输出契约

stdout 统一是 `{ code, data, msg }` 信封：

- 成功：`code === 0`。
  - `+search`：`data.list` 是课表数组。
  - `+order`：`data.codeUrl` 是预约小程序码图片地址。
- 失败：`code !== 0`，`msg` 是人类可读错误信息；同时 stderr 也会再写一份。

## 错误处理

- 信封里 `code !== 0` 即视为失败。把 `msg` 转述给用户，不要自行编造原因。
- 退出码非 0 时，先看 stdout 的信封 `msg`，再看 stderr 的补充信息。
- **出现错误时如实报告给用户，不要假想 / 猜测 / 编造课表数据或预约码地址**。宁可告诉用户"查询失败"，也不要返回任何未经接口确认的课程信息或图片链接。

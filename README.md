# sm-c-cli

SUPERMONKEY 用户端 CLI。提供面向用户与 AI 代理的命令行入口，第一版交付团课课表搜索能力。

## 安装与运行

```bash
pnpm install            # 必须用 pnpm，不要用 npm / yarn
pnpm dev <args>         # 开发期直跑 TS（tsx）
pnpm build              # 产出 dist/index.js（带 shebang）
pnpm test               # 跑所有 vitest 测试
pnpm lint               # ESLint flat config
pnpm format             # prettier 写盘
```

二进制名 `sm-c-cli`，安装后命令风格为 `sm-c-cli <resource> +<shortcut> [flags]`，例如：

```bash
sm-c-cli class-schedules +search --city 上海 --keyword 单车 --format table
```

全局 flag：

- `--format json|ndjson|table|pretty`：输出格式，默认 `json`。`pretty` 是带高亮的合法 JSON（管道里自动脱色），`table` 是面向人读的表格。
- `--verbose`：调试日志写到 stderr，不污染 stdout。
- `-v, --version` / `-h, --help`。

## 目录结构

```
src/
  index.ts                       bin 入口（#!/usr/bin/env node）
  config.ts                      包元信息、API_BASE_URL、超时
  cli/
    program.ts                   createProgram() + 全局 flag
    register.ts                  注册各 resource 子命令
  resources/
    <name>/                      一个业务域一个目录
      index.ts                   注册 <name> 子命令与各 shortcut
      api.ts                     调后端的纯函数（不依赖 commander）
      schema.ts                  Zod 输入/输出/响应 schema
      table.ts                   table 格式渲染（如有）
      <verb>.ts                  shortcut handler，例如 search.ts
      tests/                     该 resource 的单元测试
  shared/                        横切层
    envelope.ts                  ok/fail/Envelope<T>
    exit-codes.ts                EXIT 常量 + exitCodeOf
    output.ts                    parseFormat / writeEnvelope
    json-color.ts                JSON 高亮（pretty）
    schema-meta.ts               labelOf / labelsOf 读取 zod .describe
    api-paths.ts                 后端路径常量
    http/
      client.ts                  axios 单例
      errors.ts                  axios 错误 → CliError
    promise.ts                   sleep 等通用工具
    pagination.ts                fetchAllPages 通用分页
    logger.ts                    debug/warn → stderr
    errors.ts                    CliError(code, msg)
    tests/                       横切层单元测试
```

不在 src 内的关键文件：`tsconfig.json`、`tsup.config.ts`、`vitest.config.ts`、`eslint.config.js`、`.prettierrc.json`、`CLAUDE.md`、`.npmrc`。

## 输出契约（强制）

CLI 是给人和 AI Agent 使用的，输出契约是与 AI 代理之间的接口，禁止散落手写。

- 所有命令成功 / 失败统一信封 `{ code, data, msg }`，通过 `shared/envelope.ts` 的 `ok` / `fail` 构造，不要自己拼对象。
- 进程退出码统一通过 `shared/exit-codes.ts` 的 `exitCodeOf` 映射：`0` 成功；`1` 通用；`2` 参数错误；`3` 上游服务错误；`4` 鉴权错误。
- `stdout` 只写命令结果（json / ndjson / table / pretty）；人类可读错误、`--verbose` 调试日志只写 `stderr`。
- 空结果使用成功信封 + 空数组（`{ list: [] }`），不要当成错误。
- `--format pretty` 输出多行 JSON 并按 TTY 自动决定是否上色，并尊重 `NO_COLOR` / `FORCE_COLOR`。

## 字段标签的单一来源

字段中文说明只写在 Zod schema 的 `.describe('...')` 上。展示层（table 表头、help 文案、未来生成文档）通过 `shared/schema-meta.ts` 的 `labelOf(Schema, 'field')` / `labelsOf(...)` 读取。

复合列（例如把 `startTime + endTime` 渲染成「时间」）不属于单字段语义，可以在展示层显式命名，并在注释里说明原因。

```ts
// schema.ts
export const ClassSchedule = z.object({
  boxName:   z.string().describe('门店名称'),
  className: z.string().describe('课程'),
  // ...
});

// table.ts
const head = [
  labelOf(ClassSchedule, 'scheduleDate'),
  '时间', // 复合列：startTime + endTime
  labelOf(ClassSchedule, 'boxName'),
  // ...
];
```

## 扩展功能时遵循的原则

### 加一个新的 resource / shortcut

1. 在 `src/resources/<name>/` 下建目录与文件骨架（`index.ts`、`api.ts`、`schema.ts`、必要的 `<verb>.ts`、`tests/`）。
2. 后端路径加到 `src/shared/api-paths.ts`，不要在 resource 里硬编码字符串。
3. HTTP 调用必须走 `src/shared/http/client.ts` 取得的 axios 单例，不要直接 `import axios`。
4. 在 `src/cli/register.ts` 引入并调用 `register<Name>(program)` 一行注册。
5. 命令命名遵循 `<resource> +<shortcut>` 风格（前缀 `+` 表示这是高频封装）。
6. handler 里只做：解析 flags（Zod 校验）→ 调 api → 用 `ok/fail` 构造信封 → `writeEnvelope` 输出 → `process.exit(exitCodeOf(...))`。错误统一映射成 `CliError`。

### 加新的输出格式或修改输出

- 优先复用 `shared/output.ts` 的 dispatch；不要在 resource handler 内手写 `console.log(JSON.stringify(...))`。
- 给特定 resource 加自定义视图（如 `table`），实现一个纯函数 `(data) => string`，注册到 `writeEnvelope` 的 options 里。
- 调试输出走 `shared/logger.ts` 的 `debug` / `warn`，永远写 stderr。

### 接入分页接口

后端走 `limit/offset + totalHits` 协议时，使用 `shared/pagination.ts` 的 `fetchAllPages`：

```ts
const list = await fetchAllPages<Item>({
  pageSize: 50,            // 默认页大小
  intervalMs: 200,         // 默认 200ms 页间间隔
  fetchPage: async ({ limit, offset }) => {
    const res = await client.post(API_PATHS.foo, undefined, {
      params: { ...input, limit, offset },
    });
    const env = SomeEnvelope.parse(res.data);
    if (env.code !== 0) throw new CliError(env.code, env.msg);
    return { items: env.data.list, totalHits: env.data.totalHits };
  },
});
```

### 处理上游响应

- 后端返回的 JSON 必须用 Zod schema 严格 parse，不要 `as any`。spec 与实际不一致时，先确认是 mock 描述错还是后端契约错，再决定改 schema 还是改 spec。
- 后端的 `code`、`msg` 在出错时尽量透传给 CLI 信封，避免一律塞 `30000`。

## 测试与 TDD

- 严格 TDD：先写失败测试 → 写最小实现 → 重构。新增 `src/**` 的能力不允许没有测试落地。
- `describe` / `it` 标题统一中文。被测对象的标识符（函数名、类名、字段名）保留英文/原样。
- 每个 resource 把测试放在自己的 `tests/` 子目录；横切工具放 `src/shared/tests/`。
- 涉及时间或定时器（如分页间隔），用 `vi.useFakeTimers()` 与 `vi.advanceTimersByTimeAsync(...)`，不要真正 `sleep`。
- HTTP 通过 mock `getHttpClient` 来测试，不要打真实接口。

## Claude Code 协作

仓库根有 `CLAUDE.md`，里面是 AI 协作时强制遵守的项目约定（信封、目录边界、测试规则、操作约束等）。修改约定时同步更新这个文件。

# AGENTS.md

> 此文件为 Codex/Claude 在处理此存储库中的代码时提供指导。

## 测试与 TDD

- **`describe` / `it` 的用例描述统一使用中文**。包括但不限于 Vitest 的 `describe`、`it`、`test`、`it.each`、`describe.each` 的标题。
  - **Why**：项目以中文为主要协作语言，中文用例描述在 CI 输出和本地排错时更易扫读。
  - **How to apply**：新增或修改测试时，标题用中文一句话描述行为；测试代码内部的标识符、变量名、注释保持英文/原样。被测对象的名字（函数名、类名等）可以保留英文。
  - 例：`it('totalHits 为 0 时返回空数组', ...)`；不要写 `it('returns empty array when totalHits is 0', ...)`。
- 测试文件位置：每个 resource 在自己的 `tests/` 子目录下，`shared/` 下的横切工具放 `src/shared/tests/`。
- 遵循 TDD：新增能力先写失败测试，再写最小实现，最后重构；重构后继续跑测试保持通过。

## 输出契约

- CLI 成功 / 失败的结构化输出统一使用 `{ code, data, msg }` 信封，并通过 `src/shared/envelope.ts` 的 `ok` / `fail` 构造。
- 进程退出码统一通过 `src/shared/exit-codes.ts` 的 `exitCodeOf` 映射，不在 resource handler 里手写退出码。语义：`0` 成功；`1` 通用错误；`2` 参数错误；`3` 上游服务错误；`4` 鉴权错误。
- `stdout` 只写命令结果（JSON / NDJSON / pretty）；人类可读错误、调试日志、`--verbose` 信息只写 `stderr`。
- **空结果不是错误**：上游正常返回但列表为空时，仍用成功信封 + 空数组（如 `{ list: [] }`），不要映射成失败。
- 字段中文说明写在 Zod schema 的 `.describe()` 中；pretty 表头等展示层通过 `labelOf` / `labelsOf` 从 schema 元数据读取。复合列（如 `startTime + endTime` 渲染成“时间”）可以在展示层显式命名。

## 命令命名与层级

CLI 命令树是 `<resource> [<subResource>] <command>` 三段式：

- **resource**：业务域，每个对应 `src/resources/<name>/`，例如 `class-schedules`、`boxes`。
- **subResource**（可选）：resource 下的子领域，用目录嵌套表示，例如 `boxes/locations/`，命令为 `boxes locations <command>`。
- **command**：分两类，命名上严格区分：
  - **shortcut**：以 `+` 前缀，按**用户场景**封装的高频入口，可能编排多个原子调用、做参数推断、面向 agent 友好。命名带场景维度（如 `+search-by-geo`、`+order`），为未来同维度其他模式留命名槽位。
  - **原子命令**：无 `+` 前缀，与**单个 OpenAPI 调用一一对应**，动词形式（如 `geocode`、`list`、`create`），不做编排，不做参数推断。

判断标准：**场景级封装用 shortcut，API 级粒度用原子命令**。如果一个操作 agent 需要连续调多个原子命令、或参数需要自然语言推断，就是 shortcut 候选；否则保持原子命令即可。

## Resource handler 标准流程

每个 shortcut / 原子命令的 `.action(...)` 内部都按下面这套骨架来，不要随手发挥：

1. 解析 flags 并用对应的 Zod `*Input` schema 校验。
2. 调 `api.ts` 暴露的纯函数（不依赖 commander）。
3. 用 `ok` / `fail` 构造信封，**不要**手写 `{ code, data, msg }` 字面量。
4. 通过 `writeEnvelope(env, format, { table?: ... })` 输出，不要 `console.log(JSON.stringify(...))`。
5. 用 `process.exit(exitCodeOf(env.code))` 终止进程。
6. 错误统一映射成 `CliError`：Zod 校验失败 → `new CliError(40001, formatZodError(err))`；HTTP / 上游错误 → `toCliError(err)`；上游信封 `code !== 0` 在 `api.ts` 里抛 `CliError(env.code, env.msg)`，把后端的 `code` / `msg` 透传到 CLI 信封，**不要**一律塞 `30000`。

## 用户可见文案

- 用户可见的文案统一使用中文，包括 `commander` 的 resource / shortcut `description`、flag 描述、错误提示、`writeEnvelope` 在 `pretty` / `table` 模式下输出的额外提示。
- flag 名（如 `--city` / `--keyword`）保持英文，flag 后的描述用中文。
- 内部代码、函数名、类型、注释保持英文/原样。

## 目录与依赖边界

- 新增 resource 时放在 `src/resources/<name>/` 下，常见文件包括 `index.ts`、`api.ts`、`schema.ts`、`pretty.ts`、`tests/`；并在 `src/cli/register.ts` 注册。
- API 路径常量统一放在 `src/shared/api-paths.ts`，resource 的 `api.ts` 只引用常量，不直接硬编码路径。
- HTTP 调用只通过 `src/shared/http/client.ts` 创建的 axios client；resource 代码不要直接 `import axios`。
- Promise 相关通用工具放在 `src/shared/promise.ts`。
- 包管理器固定使用 `pnpm`，不要使用 `npm install` 或 `yarn` 修改依赖。

## Claude 操作约束

- 不主动启动 watch 模式（如 `vitest --watch`、`tsx --watch`），避免命令挂住。
- 不主动执行 `pnpm publish`、`git push`、创建 PR、发送消息等影响外部状态的操作；除非用户明确要求，否则先询问确认。
- 给用户提供手动测试 CLI 的命令时，统一使用 `pnpm dev <args...>`（不要用 `pnpm tsx ...` 或构建后的产物），且整条命令写在一行内，不要使用反斜杠换行或分多行。

# C++ 后端开发人员接入指南

> 面向加入 **OfferPilot-AI** 项目的 C++ 后端同学。  
> 前提：**不推翻现有 Node.js 服务**，在 `backend/` 与独立 C++ 服务上**增量扩展**；前端协议、路由路径、SSE 事件格式保持不变。

---

## 你在整体架构里的位置

当前仓库是 **pnpm workspace 轻量 monorepo**：

- **`frontend/`**：主产品为宇宙模拟面试页（`mock-interview-space`），通过 Vite 代理访问 `/api/*`
- **`backend/`**：**Express + TypeScript** 的 API 网关，负责路由、会话/报告持久化、调用 LLM 或未来 C++ 引擎

推荐接入方式（与 `docs/27.mock-interview-space前后端协作与下一阶段开发规划.md` 一致）：

```text
前端  →  Node backend（Express）  →  mock / remote LLM / C++ 引擎（HTTP 或进程内扩展）
```

C++ 同学**不必重写** `interview-routes`、`controllers`、`storage` 的对外契约；优先做 **Node 后方的能力模块**，由 `providers/cpp-engine-provider.ts` 或新增内部 client 调用。

仓库里已预留：

- `backend/src/providers/cpp-engine-provider.ts`：当前仅返回 `CPP_PROVIDER_NOT_IMPLEMENTED`
- `INTERVIEW_PROVIDER=cpp` 时工厂会选用该 Provider（见 `interview-provider-factory.ts`）

---

## 上手前必读（约半天）

**本地跑通**

- 仓库根目录：`pnpm install` → `pnpm dev:backend`（默认 `http://localhost:3030`）
- 前端：`pnpm dev`（`http://localhost:2048`，`/api` 代理到后端）
- 配置：复制 `backend/.env.example` 为 `backend/.env`

**文档**

| 文档 | 内容 |
|------|------|
| `backend/README.md` | 已有接口列表与目录说明 |
| `docs/目录说明.md` | 全仓目录与 monorepo 命令 |
| `docs/27.mock-interview-space前后端协作与下一阶段开发规划.md` | 为何用 Node 网关、C++ 扩展边界 |
| `docs/28.mock-interview-space报告后端化与服务能力第二阶段规划.md` | 报告、存储演进方向 |
| `backend/src/types/interview.ts` | 流式请求体与 SSE 事件类型（契约核心） |

**现有 HTTP 能力（勿改路径，可改实现）**

- `GET /api/health` — 健康检查
- `POST /api/interview/stream` — 模拟面试 **SSE**（`chunk` / `done` / `error`）
- `GET /api/interview/sessions`、`GET .../sessions/:sessionId/:threadId` — 会话读写
- `GET/POST /api/interview/reports*` — 报告列表、详情、生成
- `POST /api/interview/practice-pool/generate` — 弱项补练题池生成
- `POST /api/interview/history/clear` — 清空本地 JSON 存储

持久化现状：`backend/data/*.json`（会话、报告），非数据库。

---

## 从易到难：可承接的开发方向

下列按**上手难度**排列。每一项都是在**现有服务上继续写**，不要求重构前端或替换 Node 网关。

---

### 入门级：熟悉仓库与观测（不改业务协议）

**跑通并文档化 C++ 侧开发环境**

- 在 Windows/Linux 上编译、运行你们自己的 C++ 服务（若独立进程），约定与 Node 的联调地址（如 `localhost:9090`）
- 写一份团队内 `README`：依赖、编译命令、与 `pnpm dev:backend` 同时启动的顺序

**增强 `GET /api/health` 或新增内部探活**

- 在 Node 的 `health-routes` 中增加对 C++ 子服务的 **TCP/HTTP 探活**（可选字段 `cppEngine: ok | down`）
- 不碰面试主流程，只让部署与联调能看见 C++ 是否在线

**阅读并注释本地存储格式**

- `interview-sessions.json`、`interview-reports.json` 的结构与 `storage/*.ts` 读写逻辑
- 为后续「C++ 读会话做离线分析」或「导入导出」打基础；**第一版不必替换 JSON 存储**

**与现有工具函数对齐的 C++ 移植（纯逻辑、无网络）**

- Node 已有：`backend/src/utils/is-unknown-answer.ts`（识别「不知道」类回答）
- 前端亦有同名工具；可在 C++ 中实现**相同规则**的单元测试对照，保证前后端与网关判断一致  
- 同类候选：`parse-practice-pool-llm-json` 的 JSON  schema 校验（C++ 侧做校验器，Node 仍负责调 LLM）

---

### 进阶级：接入 `CppEngineProvider`（核心挂钩点）

**实现 `cpp-engine-provider` 的真实逻辑（推荐第一步交付）**

- 位置：`backend/src/providers/cpp-engine-provider.ts`
- 行为：实现 `InterviewProvider.streamInterview`，对 C++ 服务发请求，把 C++ 返回的文本**按块** yield 为 `{ type: 'chunk', content }`，结束 yield `{ type: 'done' }`，失败 yield `{ type: 'error', code, message }`
- 请求体对照：`InterviewStreamRequest`（`backend/src/types/interview.ts`）— 含 `questionTitle`、`answer`、`feedbackStyle`、`unknownAnswerStreak`、`referenceAnswerHint` 等
- 切换方式：`backend/.env` 中 `INTERVIEW_PROVIDER=cpp`，并增加如 `CPP_ENGINE_BASE_URL=http://127.0.0.1:9090`

**C++ 独立服务：最小「面试反馈」接口**

- 建议首版接口：`POST /v1/interview/feedback`（名称可议），JSON 入、**流式** JSON 行或 SSE 出
- Node 侧用 `fetch` + `ReadableStream` 或 HTTP 分块转发到现有 SSE 管道（可参考 `remote-llm-provider.ts` 的流式写法）
- **不要**改前端 `POST /api/interview/stream` 的 URL 与事件名

**超时、取消与背压**

- 前端会 `AbortSignal` 停止生成；Node 需把 signal 传给 C++ 调用（关闭 HTTP 连接或调 C++ 取消 API）
- C++ 侧实现请求超时、最大 token/字节限制，避免拖死 Node 进程

---

### 中等难度：专项能力与资料链路

**弱项补练题池（`practice-pool`）的 C++ 辅助**

- 现有：`PracticePoolService` + `POST /api/interview/practice-pool/generate`，多数走远程 LLM + `completeRemoteLlmJson`
- C++ 可做：
  - 根据 `questionReviews`、`planSnapshot` 做**本地选题/排序/去重**（不调 LLM）
  - 或对 LLM 输出做**结构化校验与修正**（与 `parse-practice-pool-llm-json.ts` 契约一致）
- 接入方式：在 `practice-pool-service.ts` 中增加分支「若配置了 C++ 则先走 C++」，**保留**现有 mock/remote 回退

**报告生成前后的分析模块**

- 现有：`report-service.ts`、`POST /api/interview/reports/generate`
- C++ 可做：会话消息统计、弱项标签提取、评分维度聚合（输出 JSON 给 Node 拼 `report summary`）
- Node 仍负责写 `interview-reports.json`，C++ 不直接改前端可见字段名

**资料解析 / 分块（与前端 material 链路对齐）**

- 前端已有资料分块、出题构建（`frontend/src/services/material/*`），目前偏前端 + LLM
- C++ 适合：PDF/Markdown/纯文本 **高性能解析**、段落切块、关键词抽取
- 接入方式：新增 **内部** 路由，例如 `POST /api/internal/document/chunk`（仅本机或内网），由 Node 在将来资料上传流程中调用；**第一版可不暴露给浏览器**

---

### 较高难度：流式引擎、检索与存储（中长期）

**稳定 SSE / 流式引擎**

- 在 C++ 中统一处理：缓冲、心跳、断线重连、分块边界
- Node 只做网关转发与鉴权（若未来有）

**检索与召回（RAG）**

- 对资料库题目、历史回答、报告摘要建索引；提供 `search` 接口供 Node 在组 `sourceContext` 时调用
- 与 `docs/27` 中「检索与召回服务」规划一致；需与前端 `material-pool`、`practice-pool` 产品语义对齐后再做

**持久化升级（SQLite / 其他）**

- 当前 JSON 文件存储适合 MVP；C++ 可引入嵌入式 DB 或独立存储服务
- 要求：**对外 API 不变**，仅替换 `storage/interview-session-store.ts` 等的底层实现；迁移脚本与回滚策略需单独设计
- **不属于第一季度必做**，避免与前端 localStorage 双写逻辑冲突（前端仍有 `services/storage`）

**高并发与治理**

- 连接池、限流、结构化日志、指标（QPS、延迟、C++ 队列深度）
- 与 Node 进程部署方式（同机 / 边车 / K8s sidecar）一起规划

---

## 建议优先做的「第一条竖切」里程碑

若只选一条最小闭环证明 C++ 已接入：

**在保持 `POST /api/interview/stream` 不变的前提下，用 C++ 服务生成面试反馈流式文本，经 `CppEngineProvider` 透出。**

验收：

- `INTERVIEW_PROVIDER=cpp` 时，宇宙页模拟面试能完整：提问 → 流式反馈 → 结束
- 停止按钮能中断 C++ 请求
- 错误时前端收到 `type: 'error'` 且 `code` 可读

其余接口可继续走现有 `remote` / `mock`。

---

## 不建议优先做（易破坏现有成果）

- 重写 `frontend/` 或改动宇宙页状态机（`useMockInterviewSpaceMockState` 等）
- 修改 `POST /api/interview/stream` 的 URL、SSE 事件类型名、字段名
- 推翻 `backend/` 目录分层（`routes` → `controllers` → `services` → `providers`）
- 第一版就上数据库并删除 JSON 存储（需前后端 storage 策略一起改）
- 替换 `remote-llm-provider` 的全部逻辑（除非团队明确切换供应商）

---

## 与前端 / Node 同事的协作边界

| 谁改 | 范围 |
|------|------|
| 前端 | `frontend/src/views/showcase`、`composables/showcase`、UI 与浏览器存储 |
| Node（现有） | 路由、Controller、JSON 存储、LLM 转发、Provider 工厂 |
| C++（你） | 高性能解析、推理编排、流式引擎、检索、可选存储引擎；通过 **Provider 或内部 HTTP** 被 Node 调用 |

联调时前端只需配置代理到 Node；**不应**让浏览器直连 C++ 端口（避免 CORS 与契约分裂）。

代码评审关注：

- 是否破坏 `InterviewStreamRequest` / `InterviewProviderEvent` 类型
- 是否保留 `mock` / `remote` 回退路径
- 环境变量是否写入 `backend/.env.example` 并有说明

---

## 相关代码索引（快速定位）

```text
backend/src/providers/cpp-engine-provider.ts   # 你的主接入类（当前空实现）
backend/src/providers/remote-llm-provider.ts    # 流式转发参考实现
backend/src/services/interview-service.ts       # 流式入口编排
backend/src/controllers/interview-controller.ts # SSE 写回客户端
backend/src/utils/build-interview-llm-messages.ts # 提示词规则（C++ 可对齐语义）
backend/src/services/practice-pool-service.ts   # 补练题池
backend/src/storage/                            # JSON 持久化
```

---

## 总结

C++ 同学在本项目中的价值是 **「在 Node 网关背后增强能力」**，而不是重做一套 API。从 **健康检查与规则移植** 入手，尽快打通 **`CppEngineProvider` + 独立 C++ 流式服务**，再逐步承接 **题池筛选、资料解析、检索与存储**。全程遵守现有 HTTP/SSE 契约，前端与已上线的 Node 能力可继续并行开发。

如有新接口，优先走 **Node 新增路由 → 调 C++**，避免前端多一套 baseURL。

相关文档：[`前后端与C++协作对齐.md`](./前后端与C++协作对齐.md)（三方职责与冻结契约）。

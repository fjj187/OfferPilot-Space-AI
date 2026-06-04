# 前后端与 C++ 协作对齐

> 本文约定 **前端（宇宙页）**、**Node 网关（`backend/`）**、**C++ 引擎服务** 三方的职责边界与冻结契约。  
> 目标：并行开发不互相踩脚；C++ 接入时不推翻已有 API。  
> 相关文档：[`C++后端开发方向.md`](./C++后端开发方向.md)、[`目录说明.md`](./目录说明.md)、[`27.mock-interview-space前后端协作与下一阶段开发规划.md`](./27.mock-interview-space前后端协作与下一阶段开发规划.md)。

---

## 协作原则（三条）

**前端只认 Node 网关**  
浏览器只请求 `http://localhost:2048` 下的 `/api/*`（Vite 代理到 `3030`），**禁止**前端直连 C++ 端口。

**对外契约以 Node 为准**  
路径、请求 JSON、SSE 事件名与字段，以 `backend/src/types/*` 与 `backend/README.md` 为权威；前端 `services/sse/sse-types.ts` 须与其保持一致。

**C++ 改实现，不改协议**  
C++ 通过 `CppEngineProvider` 或 Node 新增 **internal** 路由被调用；不擅自改 `POST /api/interview/stream` 的 URL 与事件格式。

---

## 架构与数据流

```text
┌─────────────┐     /api/*      ┌──────────────────┐     HTTP/SSE      ┌─────────────┐
│  frontend/  │ ──────────────► │  backend/        │ ───────────────► │  C++ 服务   │
│  (Vue/Vite) │   仅开发代理     │  Express 网关     │   可选 9090 等   │  (独立进程) │
└─────────────┘                 └──────────────────┘                 └─────────────┘
       │                                  │
       │ localStorage                     │ backend/data/*.json
       ▼                                  ▼
  浏览器持久化                        会话 / 报告 JSON
```

| 角色 | 目录 | 职责 |
|------|------|------|
| 前端 | `frontend/` | 宇宙页 UI、场景状态、调用 `/api`、浏览器 `localStorage` |
| Node | `backend/` | 路由、Controller、Provider 工厂、JSON 存储、转发 LLM/C++ |
| C++ | 仓库外或后续 `cpp/` | 流式反馈、解析、检索、高性能模块；由 Node 调用 |

---

## 冻结的对外 API（三方不得单方面修改）

以下接口为 **MVP 已上线联调** 契约。任何字段增删改，须 **前端 + Node + C++（若涉及）** 同步评审后再改。

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 存活探活；C++ 可在响应中扩展子状态（需 Node 改 `health-routes`，前端不依赖具体字段） |

### 模拟面试流式（C++ 首期重点）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/interview/stream` | `Content-Type: application/json`，响应 **SSE** |

**请求体**（权威：`backend/src/types/interview.ts`，前端镜像：`frontend/src/services/sse/sse-types.ts` → `InterviewStreamRequest`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `sessionId` | string | 会话 ID |
| `messageId` | string | 消息 ID |
| `threadId` | string | 线程 ID |
| `topic` / `topicLabel` | string | 主题 |
| `prompt` | string | 拼装后的提示（前端可能压缩，勿删字段） |
| `questionTitle` / `questionPrompt` | string | 题面 |
| `answer` | string | 用户作答 |
| `sourceContext` 等 | optional | 资料上下文 |
| `feedbackStyle` | optional | `followup` \| `corrective` \| `guided` |
| `questionIndex` / `questionCount` | optional | 题序，约束不切题 |
| `unknownAnswerStreak` | optional | 连续「不知道」次数 |
| `forceRevealReferenceAnswer` | optional | 是否强制揭晓参考答案 |
| `referenceAnswerHint` | optional | 参考答案提示 |

**SSE 事件**（`data:` 行为 JSON，事件名可用 `message` 或默认；payload `type` 如下）：

| `type` | 含义 | 载荷 |
|--------|------|------|
| `chunk` | 流式片段 | `{ "type":"chunk", "content":"..." }` |
| `done` | 结束 | `{ "type":"done" }` |
| `error` | 失败 | `{ "type":"error", "code":"...", "message":"..." }` |

前端解析：`frontend/src/services/sse/sse-client.ts`、`interview-message-parser.ts`。  
Node 产出：`backend/src/utils/sse.ts`、`providers/*`。

### 会话与历史

| 方法 | 路径 |
|------|------|
| `GET` | `/api/interview/sessions` |
| `GET` | `/api/interview/sessions/:sessionId/:threadId` |
| `POST` | `/api/interview/history/clear` |

### 报告

| 方法 | 路径 |
|------|------|
| `GET` | `/api/interview/reports` |
| `GET` | `/api/interview/reports/:sessionId` |
| `POST` | `/api/interview/reports/generate` |

### 弱项补练题池

| 方法 | 路径 |
|------|------|
| `POST` | `/api/interview/practice-pool/generate` |

请求/响应权威类型：`backend/src/types/practice-pool.ts`，前端：`frontend/src/types/practice-pool.ts`、`practice-pool-api.ts`。

---

## 职责矩阵：谁改什么

### 前端负责人 — 可以做

| 范围 | 路径示例 |
|------|----------|
| 宇宙页 UI、动画、文案 | `frontend/src/components/showcase/mock-interview-space/**` |
| 场景状态（不改 stream 入参语义） | `frontend/src/composables/showcase/useMockInterviewSpace*` |
| 共享展示组件 | `frontend/src/components/mock-interview/`、`library/`、`report/` |
| 样式 | `frontend/src/styles/**` |
| 浏览器本地存储读写逻辑 | `frontend/src/services/storage/*`（勿改与后端 DTO 绑死的字段名） |

### 前端负责人 — 不要做

| 范围 | 路径 | 原因 |
|------|------|------|
| 整个 Node 后端 | `backend/**` | C++ / Node 领域 |
| Legacy 工作台 | `frontend/src/views/workbench/**`、`components/workbench/**` | 已冻结 |
| 流式协议与 API 客户端 | `frontend/src/services/sse/**` | 与 C++ 契约绑定 |
| 面试/报告/题池 API | `frontend/src/services/interview/*-api.ts`、`practice/practice-pool-api.ts` | 除非走变更流程 |
| 契约类型 | `frontend/src/services/sse/sse-types.ts`、`types/practice-pool.ts`（DTO 部分） | 须三方对齐 |
| 代理与后端地址 | `frontend/vite.config.ts` 的 `/api` proxy | 联调端口统一 |
| 「不知道」判定规则 | `frontend/src/utils/interview/is-unknown-answer.ts` | 与 `backend/`、C++ 应对齐 |

### Node / C++ 负责人 — 可以做

| 范围 | 说明 |
|------|------|
| `backend/src/providers/cpp-engine-provider.ts` | 实现 C++ 调用与流式转发 |
| `backend/.env`、`backend/.env.example` | `INTERVIEW_PROVIDER=cpp`、`CPP_ENGINE_BASE_URL` 等 |
| `backend/src/storage/*` | JSON 持久化；中长期可换实现，API 不变 |
| `backend/src/services/*`、`controllers/*` | 在契约内扩展逻辑 |
| 独立 C++ 服务 | 流式反馈、解析、检索等 |

### Node / C++ 负责人 — 不要做

| 范围 | 原因 |
|------|------|
| 修改上表 **冻结 API** 的 path、SSE `type`、核心 JSON 字段名 | 会导致前端无需改代码也联调失败 |
| 重写 `frontend/` 宇宙页状态机 | 前端职责 |
| 要求前端直连 C++ | 破坏单网关与 CORS 策略 |

---

## 环境变量与联调约定

| 项 | 值 / 说明 |
|----|-----------|
| 前端 dev | `pnpm dev` → `http://localhost:2048` |
| Node dev | `pnpm dev:backend` → `http://localhost:3030` |
| 流式 URL（开发） | 前端默认 `POST /api/interview/stream`（代理） |
| Provider 切换 | `backend/.env` → `INTERVIEW_PROVIDER=mock \| remote \| cpp` |
| C++ 地址（预留） | 建议 `CPP_ENGINE_BASE_URL=http://127.0.0.1:9090`（实现后写入 `.env.example`） |
| 前端环境模板 | `frontend/.env.template` |
| 后端环境模板 | `backend/.env.example` |

**联调检查清单**

- 仅启动 Node、不启动 C++：`INTERVIEW_PROVIDER=remote` 或 `mock`，宇宙页可流式反馈。
- C++ 联调：`INTERVIEW_PROVIDER=cpp`，C++ 进程已监听，停止按钮能中断流。
- 前端 Network 面板请求 host 为 `2048`，path 为 `/api/...`，无直连 `9090`。

---

## 共享业务规则（改一处要知会另两方）

| 规则 | Node | 前端 | C++ |
|------|------|------|-----|
| 「不知道」类回答识别 | `backend/src/utils/is-unknown-answer.ts` | `frontend/src/utils/interview/is-unknown-answer.ts` | 建议同语义单测对照 |
| 切题约束（勿在回复中下题） | `build-interview-llm-messages.ts` | `interview-stream.ts` 内拼接 | C++ 提示词应对齐 |
| 连续不知道强制揭晓 | `InterviewStreamRequest.forceRevealReferenceAnswer` | `useMockInterviewSpaceMockState` 计算 | Provider 须尊重该字段 |

---

## 契约变更流程（必须走）

当产品需要 **新增/修改/删除** 冻结字段或接口时：

**第一步：写清变更说明**  
在 Issue 或 `docs/开发记录.md` 中写：动机、字段表、是否兼容旧客户端、回滚方式。

**第二步：三方确认**  
前端、Node、C++（若影响 Provider）确认排期；**禁止**单方先合并。

**第三步：按顺序改**  
建议顺序：① `backend/src/types/*` → ② `backend` 实现 → ③ C++ 适配 → ④ `frontend` types + API + UI 消费。

**第四步：联调验收**  
`mock` / `remote` / `cpp` 三种 Provider 至少验证 `stream`；相关单测更新（`frontend/__tests__`、`backend` 若有）。

**第五步：更新本文档**  
变更合并后更新本文件对应表格。

---

## 首期里程碑对齐（C++）

**目标**：`INTERVIEW_PROVIDER=cpp` 时，宇宙页模拟面试完整流式反馈，协议与 `remote` 一致。

| 验收项 | 负责 |
|--------|------|
| `CppEngineProvider` 实现并转发 chunk/done/error | C++ + Node |
| 停止生成能 abort C++ 请求 | C++ + Node |
| 前端无代码改动或仅改 env 开关 | 前端 |
| `.env.example` 补充 C++ 相关项 | Node |

未纳入首期、勿阻塞首期：**题池 C++ 化**、**资料解析**、**数据库替换 JSON**。

---

## 冲突快速对照

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 前端 404 on `/api/stream` | 路径写错或未走代理 | 必须是 `/api/interview/stream` |
| 有 chunk 但 UI 不更新 | 改了 SSE 解析或 `type` 名 | 恢复 `chunk`/`done`/`error` |
| C++ 正常但前端仍走 mock | 未开 DEV 代理或 `VITE_INTERVIEW_SSE_URL` 为空且非 DEV | 查 `interview-stream.ts` |
| 知道/不知道逻辑不一致 | 只改了一端 `is-unknown-answer` | 三方规则对齐 |
| 题池生成字段对不上 | 只改了 `types/practice-pool` 一侧 | 对照 `backend/src/types/practice-pool.ts` |

---

## 文档与代码索引

| 文档 | 用途 |
|------|------|
| [`C++后端开发方向.md`](./C++后端开发方向.md) | C++ 任务从易到难 |
| [`目录说明.md`](./目录说明.md) | monorepo 目录 |
| [`backend/README.md`](../backend/README.md) | 接口列表 |
| [`18.mock-interview-space后续开发边界规范.md`](./18.mock-interview-space后续开发边界规范.md) | 宇宙页前端边界 |

| 契约代码 | 路径 |
|----------|------|
| 流式请求/事件（后端权威） | `backend/src/types/interview.ts` |
| 流式请求/事件（前端） | `frontend/src/services/sse/sse-types.ts` |
| C++ 接入点 | `backend/src/providers/cpp-engine-provider.ts` |
| Provider 工厂 | `backend/src/services/interview-provider-factory.ts` |
| 题池 DTO | `backend/src/types/practice-pool.ts` |

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-27 | 初版：三方边界、冻结 API、职责矩阵、变更流程、首期里程碑 |

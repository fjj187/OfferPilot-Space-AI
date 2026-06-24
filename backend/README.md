# mock-interview backend

这是当前仓库内的最小 Node.js 后端目录，使用 `Express` 提供接口。

当前目标：

1. 提供最小 API 服务。
2. 提供 `POST /api/interview/stream` SSE 接口。
3. 支持 `mock` 和 `remote` provider。
4. 将最小 session / message 数据持久化到本地 JSON 文件。
5. 为未来真实模型 provider 和 C++ 服务接入预留扩展层。

## 当前已完成能力

当前 `backend/` 已经具备以下最小闭环能力：

1. `POST /api/interview/stream` SSE 流式接口。
2. `mock` / `remote` provider 双实现。
3. 最小 session / message 本地 JSON 持久化。
4. 会话列表读取接口。
5. 会话详情读取接口。
6. 报告列表 / 详情 / 生成接口（Phase 28）。

## 当前接口

### `GET /api/health`

健康检查。

### `POST /api/interview/stream`

模拟面试流式接口，返回 SSE 事件：

- `chunk`
- `done`
- `error`

当前 `remote`（远程模型）模式会优先读取后台模型管理中已启用的默认模型；如果后台没有可用模型，才回退到 `INTERVIEW_REMOTE_*`（远程模型环境变量）配置。

### `GET /api/models/enabled`

返回用户侧可见的已启用模型列表，只包含安全字段：

- `modelId`（模型标识）
- `displayName`（展示名称）
- `provider`（模型供应商）
- `isDefault`（是否默认）

### `GET /api/interview/sessions`

返回最小历史会话列表，供历史页和报告页读取。

### `GET /api/interview/sessions/:sessionId/:threadId`

返回指定会话详情，包含完整消息数组。

### `GET /api/interview/reports`

返回报告摘要列表（一轮一条，按 `sessionId`）。

### `GET /api/interview/reports/:sessionId`

返回指定轮次的报告摘要。

### `POST /api/interview/reports/generate`

根据已存储会话消息生成最小报告摘要并落盘。结束本轮时由前端调用。

### `POST /api/interview/history/clear`

清空后端全部会话与报告存储（与前端「清空对话历史」联动）。

## 目录说明

```text
backend/
├─ src/
│  ├─ app.ts
│  ├─ routes/
│  ├─ controllers/
│  ├─ services/
│  ├─ providers/
│  ├─ storage/
│  ├─ types/
│  └─ utils/
```

## 开发命令

```bash
npm install
npm run dev
```

默认端口：

`http://localhost:3030`

默认本地存储目录：

`backend/data/interview-sessions.json`

报告存储：

`backend/data/interview-reports.json`

健康检查：

`GET /api/health`

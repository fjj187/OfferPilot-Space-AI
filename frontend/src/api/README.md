# Legacy Chat API（旧 Chat MVP 接口层）

> **状态**：Legacy — 仅供原始 Chat 模板与 `store/business` 使用，模拟面试主流程请用 `services/` 下各领域 API。

## 职责边界

| 目录 | 用途 |
|------|------|
| `api/`（本目录） | 早期 Chat Bot 单轮对话示例接口（如 `getXxxxPrompt`） |
| `services/interview/` | 模拟面试会话、报告 API |
| `services/practice/` | 专项刷题 / 题池 API |
| `services/sse/` | 面试流式 SSE |
| `services/storage/` | 浏览器 `localStorage` 持久化读写 |

新功能**不要**在本目录新增；请按领域放入 `services/<domain>/`。

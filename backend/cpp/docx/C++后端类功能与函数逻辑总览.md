# C++ 后端类功能与函数逻辑总览

本文用于面试复习，目标是把 `OfferPilot-AI/backend/cpp` 里的主要类、职责和函数调用链串起来。

## 1. 整体分层

代码整体可以分成 6 层：

1. 启动层：`main.cpp`
2. HTTP 层：`HttpServer`、`AuthRoutes`、`InterviewRoutes`
3. 控制层：`AuthController`、`InterviewController`
4. 业务层：`AuthService`、`InterviewService`、`ReportService`
5. 基础设施层：`MySQLConn`、`MySQLConnectionPool`、`Threadpool`、`TaskQueue`、`PasswordHasher`
6. 外部能力层：`InterviewProvider`、`MockInterviewProvider`、`OpenAIInterviewProvider`、`IReportAiClient`、`OpenAIReportAiClient`

核心思路是：控制层只做请求/响应转换，业务层负责规则，仓储和 provider 负责具体存储和 AI 调用。

## 2. 请求主链路

### 2.1 登录

`AuthController::login()` -> `AuthService::login()` -> `IAuthUserRepository::findByUsername()` -> `PasswordHasher::verify()` -> `IAuthSessionRepository::save()`

### 2.2 流式面试

`InterviewController::streamInterview()` -> `InterviewService::streamInterview()` -> `ISessionRepository::recordUserMessage()` -> `InterviewProvider::streamFeedback()` -> `ISessionRepository::recordAssistantMessage()`

### 2.3 报告生成

`InterviewController::generateReport()` -> `ReportService::generateReport()` -> `ISessionRepository::listSessionsBySessionId()` -> `IReportAiClient::generateJson()` -> `IReportRepository::upsertReport()`

## 3. 类说明

### 3.1 `main.cpp`

职责：
- 读取环境变量
- 初始化配置
- 创建数据库连接、仓储、Service、Controller、Routes
- 启动 HTTP 服务

关键逻辑：
- `loadEnvFile()` 读取 `.env`
- `AppConfig::loadFromEnv()` 装载配置
- 根据 `USE_MOCK_INTERVIEW_PROVIDER` 决定使用 mock 还是 OpenAI provider
- 注册 `/api/health`、认证接口、面试接口

### 3.2 `AppConfig`

职责：
- 维护启动配置
- 从环境变量读取 HTTP 端口和数据库配置

主要函数：
- `loadFromEnv()`：从环境变量读取并写入单例
- `getInstance()`：返回单例
- `isConfigValid()`：检查端口是否合法

### 3.3 `HttpServer`

职责：
- 对 `httplib::Server` 做一层封装
- 统一管理启动、停止、路由注册、中间件和错误处理

典型用途：
- `get()`、`post()` 注册路由
- `setupMiddleware()` 配置中间件
- `setupErrorHandler()` 配置统一错误输出

### 3.4 `AuthRoutes` / `InterviewRoutes`

职责：
- 把 Controller 的方法注册到 HTTP 路由上

映射关系：
- `AuthRoutes`：
  - `/api/auth/login`
  - `/api/auth/me`
  - `/api/auth/logout`
- `InterviewRoutes`：
  - `/api/interview/stream`
  - `/api/interview/reports/generate`
  - `/api/interview/reports`
  - `/api/interview/reports/:sessionId`
  - `/api/interview/sessions`
  - `/api/interview/sessions/:sessionId/:threadId`
  - `/api/interview/history/clear`

### 3.5 `AuthController`

职责：
- 处理登录、查看当前用户、退出登录
- 负责 JSON 请求和响应格式

函数逻辑：
- `login()`：解析 `username/password`，调用 `AuthService::login()`，成功返回 token 和用户信息
- `me()`：从请求头提取 token，返回当前用户
- `logout()`：校验登录态后吊销 token
- `parseLoginRequest()`：从请求体提取登录参数并做必填校验
- `sendJson()`：统一 JSON 响应

### 3.6 `InterviewController`

职责：
- 处理流式面试、报告、会话历史相关接口
- 把前端 JSON 转成内部 DTO

函数逻辑：
- `streamInterview()`：把请求体转成 `InterviewStreamRequest`，再交给 `InterviewService`
- `generateReport()`：把报告生成请求转成 `GenerateReportRequest`
- `getReport()`：按 `sessionId` 读取单条报告
- `listReports()`：返回报告列表
- `listSessions()`：返回会话列表
- `getSession()`：返回单个会话和消息明细
- `clearHistory()`：清空会话历史

### 3.7 `AuthService`

职责：
- 处理登录态和 token 生命周期

函数逻辑：
- `login()`：
  1. 按用户名查用户
  2. 判断账号是否启用
  3. 用 `PasswordHasher` 验证密码
  4. 生成 token
  5. 写入 session 仓储
- `authenticateByRequest()`：从 `Authorization` 头取 Bearer token
- `authenticateByToken()`：按 token 查 session，恢复用户信息
- `logout()`：吊销 token
- `extractBearerToken()`：解析标准 Bearer 头
- `generateToken()`：用 OpenSSL 随机数生成 token

### 3.8 `InterviewService`

职责：
- 串起面试流式调用和会话落库

函数逻辑：
- `streamInterview()`：
  1. 校验请求字段
  2. 构造 provider 上下文
  3. 先记录用户消息
  4. 调用 provider 流式输出
  5. 拼接 assistant 全量回复
  6. provider 完成后记录 assistant 消息
- `validateRequest()`：逐字段校验面试请求
- `createProviderContext()`：填充 requestId、timeout 等上下文
- `recordUserMessage()` / `recordAssistantMessage()`：调用仓储层落库
- `listSessions()` / `getSession()` / `clearHistory()`：会话查询和清理

### 3.9 `ReportService`

职责：
- 根据会话生成结构化报告
- AI 失败时提供 fallback

函数逻辑：
- `generateReport()`：
  1. 校验 `sessionId`
  2. 查询会话
  3. 取最新 thread 作为上下文
  4. 检查是否已有报告
  5. 通过 `ReportPromptBuilder` 构造 prompt
  6. 调用 AI 客户端生成 JSON
  7. 解析 AI 返回；失败则 fallback
  8. 保留已有报告的 `id/createdAt`
  9. `upsert` 到仓储
- `parseAiResultToEntity()`：把 AI JSON 转成 `InterviewReportEntity`
- `buildFallbackReport()`：构造稳定可用的本地报告
- `listReports()` / `getReportBySessionId()` / `clearAllReports()`

### 3.10 `ReportPromptBuilder`

职责：
- 负责把会话内容组装成 AI 可消费的 prompt

函数逻辑：
- `buildSystemPrompt()`：要求模型只输出 JSON
- `buildUserPrompt()`：拼接 session 信息、请求信息、消息摘要、复盘材料
- `buildMessageDigest()`：只保留最近消息，避免 prompt 过长
- `buildReviewDigest()`：只保留部分问答复盘，控制输入规模
- `truncateText()`：截断过长文本

### 3.11 `PasswordHasher`

职责：
- 处理密码哈希与校验

函数逻辑：
- `hash()`：使用 PBKDF2 + SHA256 生成摘要
- `verify()`：重新哈希并做常量时间比较

### 3.12 `MySQLConn`

职责：
- 封装 MySQL C API
- 负责连接、查询、更新、事务和结果集管理

函数逻辑：
- `connect()`：建立数据库连接
- `query()`：执行查询并保存结果集
- `update()`：执行更新语句
- `next()`：遍历结果集下一行
- `value()`：取当前行某一列的字符串值
- `transaction()` / `commit()` / `rollback()`：事务控制
- `refreshAlivetime()` / `getAlivetime()`：维护连接活跃时间

### 3.13 `MySQLConnectionPool`

职责：
- 管理数据库连接复用

函数逻辑：
- `acquire()`：优先复用空闲连接，不够则尝试扩容，最多等待到超时
- `release()`：归还连接到空闲队列
- `createRawConn()`：新建并初始化连接
- `destroyIdleLocked()`：销毁所有空闲连接
- `idleSize()` / `totalSize()` / `busySize()`：状态统计

### 3.14 `MySQLConnHandle`

职责：
- RAII 连接句柄

作用：
- 句柄析构时自动归还连接，避免忘记释放

### 3.15 `TaskQueue`

职责：
- 线程安全任务队列

函数逻辑：
- `addTask()`：入队
- `takeTask()`：出队
- `taskNumber()`：返回任务数

### 3.16 `Threadpool`

职责：
- 维护 worker 线程和管理线程

函数逻辑：
- `addTask()`：投递任务
- `worker()`：等待任务并执行
- `manager()`：监控任务队列长度，决定扩容/缩容
- `threadExit()`：线程退出前清理自己的槽位
- 析构函数：关闭线程池并回收资源

### 3.17 `InterviewProvider`

职责：
- 面试反馈生成接口

关键点：
- `streamFeedback()` 是流式接口，provider 每生成一段内容就回调一次
- `ProviderContext` 用来支持取消和超时

### 3.18 `MockInterviewProvider`

职责：
- 本地开发和联调时模拟流式面试回答

逻辑：
- 校验请求
- 根据 `feedbackStyle` 生成不同风格的回答
- 按 chunk 分段输出
- 通过 `emitChunk()`、`emitDone()`、`emitError()` 发事件

### 3.19 `OpenAIInterviewProvider`

职责：
- 调用 OpenAI 兼容接口生成真实流式面试反馈

逻辑：
- `parseBaseUrl()`：拆解 baseUrl
- `createClient()`：构造 HTTP 客户端
- `buildSystemPrompt()`：生成系统提示词
- `buildRequestBody()`：组装 chat/completions 请求体
- `streamFeedback()`：发送请求并逐行解析 SSE，转成内部事件

### 3.20 `IReportAiClient` / `OpenAIReportAiClient`

职责：
- 报告生成的 AI 接口与实现

通常逻辑：
- 接收 system prompt 和 user prompt
- 调用大模型
- 返回 JSON 字符串供 `ReportService` 解析

## 4. 仓储层概览

接口类：
- `IAuthUserRepository`
- `IAuthSessionRepository`
- `ISessionRepository`
- `IReportRepository`

实现类：
- `JsonAuthUserRepository`
- `JsonAuthSessionRepository`
- `JsonSessionRepository`
- `JsonReportRepository`
- `MySQLAuthUserRepository`
- `MySQLAuthSessionRepository`
- `MySQLSessionRepository`
- `MySQLReportRepository`
- `MySQLStreamCheckpointRepository`

仓储层只负责数据持久化，不负责业务决策。

## 5. 面试时可以怎么讲

可以把项目总结成一句话：

> 这是一个支持登录、流式面试、AI 复盘报告生成的 C++ 后端，控制层负责协议转换，业务层负责规则，仓储层负责持久化，provider 负责对接模型。

如果被继续追问，可以再补：
- 为什么要有 `ProviderContext`
- 为什么报告生成要先查 session 再调 AI
- 为什么 `MySQLConnHandle` 要用 RAII
- 为什么流式接口要先保存 user message
- 为什么 AI 报告要有 fallback


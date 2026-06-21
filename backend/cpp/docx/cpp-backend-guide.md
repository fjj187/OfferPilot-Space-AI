# OfferPilot-AI C++ 后端指南

这份文档说明当前 `backend/cpp` 的真实实现。重点不是“设计目标”，而是“现在代码已经做了什么、每个类怎么协作、哪些功能仍然是占位”。

---

## 1. 当前后端总体结构

现在的 C++ 后端实际上分成两条线：

1. 新的 HTTP 面试流式链路
   - `HttpServer`
   - `InterviewRoutes`
   - `InterviewController`
   - `InterviewService`
   - `InterviewProvider`
   - `MockInterviewProvider`
   - `JsonSessionRepository`

2. 旧的报告/MySQL 链路
   - `InterviewReport`
   - `ReportRepository`
   - `ReportCommandHandler`
   - `MySQLConn`

当前真正对外提供 HTTP 服务的是第一条线。第二条线还在项目里，但没有接入新的 `main.cpp` 启动流程。

请求主链路如下：

```text
HTTP Request
-> HttpServer
-> InterviewRoutes
-> InterviewController
-> InterviewService
-> InterviewProvider
-> JsonSessionRepository
```

---

## 2. 启动入口

### 2.1 `main.cpp`

文件：
- `src/main.cpp`

职责：
- 初始化控制台编码
- 从环境变量读取配置
- 初始化 HTTP 服务
- 注册健康检查接口
- 组装 provider、repository、service、controller、routes
- 启动 HTTP server

当前启动流程：

1. `AppConfig::loadFromEnv()` 读取环境变量。
2. `config.isConfigValid()` 校验配置。
3. 创建 `HttpServer`。
4. 注册中间件和错误处理器。
5. 注册 `/api/health`。
6. 创建 `MockInterviewProvider`。
7. 创建 `JsonSessionRepository("data/interview_sessions.json")`。
8. 创建 `InterviewService`。
9. 创建 `InterviewController`。
10. 创建 `InterviewRoutes` 并注册路由。
11. 启动服务。

代码结构上，这里已经体现了清晰的依赖方向：

```cpp
MockInterviewProvider provider;
JsonSessionRepository sessionRepo("data/interview_sessions.json");
InterviewService service(provider, sessionRepo);
InterviewController controller(service);
InterviewRoutes routes(httpServer, controller);
```

说明：
- 当前 `main.cpp` 只启动 HTTP 面试后端。
- 旧的 `ReportCommandHandler` 和 `ReportRepository` 不在当前启动链路中。

---

## 3. 配置层

### 3.1 `AppConfig`

文件：
- `include/app_config.hpp`
- `src/app_config.cpp`

职责：
- 从环境变量读取运行配置
- 提供默认端口和数据库连接参数
- 校验配置是否完整

成员：

```cpp
int httpPort;
std::string dbHost;
int dbPort;
std::string dbName;
std::string dbUser;
std::string dbPassword;
std::string logLevel;
```

核心逻辑：

- 构造函数中设置默认值：
  - `httpPort = 3030`
  - `dbHost = "127.0.0.1"`
  - `dbPort = 3306`
  - `dbName = ""`
  - `dbUser = "root"`
  - `dbPassword = ""`
  - `logLevel = "info"`
- `loadFromEnv()` 使用 `_dupenv_s` 读取：
  - `HTTP_PORT`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
- `isConfigValid()` 只做简单非空/端口范围校验。

当前问题：
- 新的 HTTP 面试链路并不使用 MySQL，但 `isConfigValid()` 仍然强制要求数据库参数非空。
- 这意味着当前程序即使只想跑面试流式服务，也要配数据库环境变量。

### 3.2 `ConfigTypes`

文件：
- `include/types/ConfigTypes.hpp`

用途：
- 这是更完整的配置类型定义，包含：
  - `DatabaseConfig`
  - `ProviderConfig`
  - `BackendConfig`
- 目前这套类型在现有启动代码里没有完整接入，更多是预留结构。

---

## 4. HTTP 封装层

### 4.1 `HttpServer`

文件：
- `include/http_server.hpp`
- `include/http_server.cpp`

职责：
- 封装 `httplib::Server`
- 统一 GET/POST 注册方式
- 统一中间件和错误处理
- 负责真正启动和停止服务

成员：

```cpp
httplib::Server m_server;
int m_port;
bool m_running;
```

主要方法：

```cpp
HttpServer(int port);
~HttpServer();
void start();
void stop();
bool isRunning() const;
int getPort() const;
void get(const std::string& path, const httplib::Server::Handler& handler);
void post(const std::string& path, const httplib::Server::Handler& handler);
void setupMiddleware();
void setupErrorHandler();
```

实现逻辑：

- `get()` / `post()` 只是把路由注册到 `httplib::Server`。
- `setupMiddleware()` 设置了一个 pre-routing handler，统一加上：
  - `Access-Control-Allow-Origin: *`
- `setupErrorHandler()` 对 404 统一返回 JSON：
  - `{"success":false,"error":"Not Found"}`
- `start()` 调用 `listen("0.0.0.0", m_port)` 启动监听。
- 析构时如果正在运行，会调用 `stop()`。

注意点：
- 这个封装很薄，没有做线程池、超时管理、鉴权、日志等能力。
- 目前它更像是对 `httplib` 的一层语法糖。

---

## 5. 路由层

### 5.1 `InterviewRoutes`

文件：
- `include/InterviewRoutes.hpp`
- `src/InterviewRoutes.cpp`

职责：
- 只负责 URL 和 controller 方法的映射
- 不处理业务逻辑

成员：

```cpp
HttpServer& m_httpServer;
InterviewController& m_controller;
```

注册的路由：

- `POST /api/interview/stream`
- `GET /api/interview/stream`
- `POST /api/interview/reports/generate`
- `GET /api/interview/sessions`
- `GET /api/interview/sessions/:sessionId/:threadId`
- `POST /api/interview/history/clear`

实现特点：

- 路由层是纯分发层。
- 这里直接把请求转给 `InterviewController` 的对应方法。

当前现状：

- `streamInterview`、`listSessions`、`getSession`、`clearHistory` 已经有实际逻辑。
- `generateReport` 还是 `501 Not Implemented`。
- `getReport`、`listReports`、`createSession`、`sendMessage` 也还是占位函数。

---

## 6. 控制器层

### 6.1 `InterviewController`

文件：
- `include/interview_controller.hpp`
- `src/interview_controller.cpp`

职责：
- 接收 HTTP 请求
- 解析 JSON
- 调用 service
- 将 service 的事件或数据转成 HTTP 响应

成员：

```cpp
InterviewService& m_service;
```

私有工具：

```cpp
InterviewStreamRequest parseStreamRequest(const nlohmann::json& body) const;
static std::string serializeSseEvent(const std::string& eventName, const std::string& data);
```

#### 6.1.1 `parseStreamRequest()`

作用：
- 把请求 JSON 解析成 `InterviewStreamRequest`

解析内容：
- 必填字段：
  - `sessionId`
  - `messageId`
  - `threadId`
  - `topic`
  - `topicLabel`
  - `prompt`
  - `questionTitle`
  - `questionPrompt`
  - `answer`
- 可选字段：
  - `sourceContext`
  - `sourceDocumentName`
  - `sourceDocumentSummary`
  - `sourceDocumentTags`
  - `sourceDocumentExcerpt`
  - `options.feedbackStyle`
  - `options.format`
  - `options.questionIndex`
  - `options.questionCount`
  - `options.unknownAnswerStreak`
  - `options.forceRevealReferenceAnswer`
  - `options.referenceAnswerHint`

这里还做了两个字符串枚举解析：

- `feedbackStyle`
  - `followup`
  - `corrective`
  - `guided`
- `format`
  - `plain`
  - `markdown`

#### 6.1.2 `streamInterview()`

作用：
- 处理流式面试请求
- 返回 SSE 响应

流程：

1. 解析请求体 JSON。
2. 转换成 `InterviewStreamRequest`。
3. 设置 SSE 响应头：
   - `Content-Type: text/event-stream; charset=utf-8`
   - `Cache-Control: no-cache, no-transform`
   - `Connection: keep-alive`
4. 使用 `set_chunked_content_provider()` 将 service 的事件逐段写回客户端。

事件映射：

- `Chunk` -> `event: chunk`
- `Done` -> `event: done`
- `Error` -> `event: error`

SSE 格式由 `serializeSseEvent()` 生成：

```text
event: chunk
data: ...

```

异常处理：
- 如果 JSON 解析失败或请求体格式错误，返回 `400`。

#### 6.1.3 其他接口

以下方法目前只是占位：

- `generateReport()`
- `getReport()`
- `listReports()`
- `createSession()`
- `sendMessage()`

它们现在统一返回：

```json
{"success":false,"error":"Not implemented"}
```

#### 6.1.4 现有可用接口

- `listSessions()`
  - 调用 `m_service.listSessions()`
  - 转成 JSON 数组返回
- `getSession()`
  - 从路径参数读取 `sessionId` 和 `threadId`
  - 调用 `m_service.getSession()`
  - 找不到返回 `404`
  - 找到则返回会话详情和消息列表
- `clearHistory()`
  - 调用 `m_service.clearHistory()`
  - 清空本地会话 JSON

---

## 7. 业务层

### 7.1 `InterviewService`

文件：
- `include/services/InterviewService.hpp`
- `src/services/InterviewService.cpp`

职责：
- 做业务校验
- 组织 provider 调用
- 记录用户消息和助手消息
- 提供会话查询和历史清空能力

成员：

```cpp
InterviewProvider& m_provider;
JsonSessionRepository& m_sessionRepository;
```

主要方法：

```cpp
void streamInterview(
    const InterviewStreamRequest& request,
    std::function<void(const InterviewStreamEvent&)> callback,
    std::shared_ptr<ProviderContext> context = nullptr);

std::vector<InterviewSessionSummary> listSessions();
std::optional<InterviewSessionDetail> getSession(const std::string& sessionId, const std::string& threadId);
void clearHistory();
```

私有方法：

```cpp
bool validateRequest(const InterviewStreamRequest& request, std::string& errorMessage);
std::shared_ptr<ProviderContext> createProviderContext(const InterviewStreamRequest& request);
bool recordUserMessage(const InterviewStreamRequest& request);
bool recordAssistantMessage(const InterviewStreamRequest& request, const std::string& assistantContent);
```

#### 7.1.1 `validateRequest()`

作用：
- 校验流式请求是否包含必需字段

当前必填字段：
- `sessionId`
- `messageId`
- `threadId`
- `topic`
- `topicLabel`
- `prompt`
- `questionTitle`
- `questionPrompt`
- `answer`

如果缺失，会返回：

```json
ApiErrorCode::InvalidRequest
```

#### 7.1.2 `createProviderContext()`

作用：
- 创建 provider 上下文

当前填充内容：
- `requestId = sessionId + ":" + messageId`
- `timeoutMs = 30000`
- `cancelFlag = false`
- `providerName = "InterviewProvider"`

这个上下文主要是给 provider 做取消、超时等扩展预留。

#### 7.1.3 `streamInterview()`

这是整条链路最核心的业务函数。

实际流程：

1. 校验请求。
2. 创建 provider 上下文。
3. 先记录用户消息到仓储。
4. 调用 `m_provider.streamFeedback()`。
5. 在回调里累积 assistant 的 chunk 内容。
6. 如果 provider 正常完成，则把 assistant 内容写回仓储。

事件处理逻辑：

- `Chunk`
  - 累加到 `assistantContent`
  - 原样透传给 controller
- `Error`
  - 标记 provider 失败
  - 原样透传
- `Done`
  - 标记流结束
  - 原样透传

持久化策略：

- 用户消息先写入。
- assistant 完整内容在流结束后统一写入。
- 如果 assistant 写入失败，会再补一个 storage error 事件。

#### 7.1.4 `listSessions()` / `getSession()` / `clearHistory()`

这三个方法只是对仓储层的直接封装：

- `listSessions()` -> `m_sessionRepository.listSessions()`
- `getSession()` -> `m_sessionRepository.getSession(sessionId, threadId)`
- `clearHistory()` -> `m_sessionRepository.clearAll()`

---

## 8. Provider 层

### 8.1 `InterviewProvider`

文件：
- `include/providers/InterviewProvider.hpp`

职责：
- 定义“面试回复生成器”的抽象接口
- 让 service 不依赖具体实现

上下文结构：

```cpp
struct ProviderContext {
    std::string requestId;
    int timeoutMs = 30000;
    bool cancelFlag = false;
    std::string providerName;
};
```

抽象方法：

```cpp
virtual void streamFeedback(
    const InterviewStreamRequest& request,
    std::function<void(const InterviewStreamEvent&)> callback,
    std::shared_ptr<ProviderContext> context = nullptr) = 0;
```

设计含义：
- 输入是完整请求。
- 输出不通过 return，而是通过 callback 一段一段推送。
- 这让它天然适配 SSE。

### 8.2 `MockInterviewProvider`

文件：
- `include/providers/MockInterviewProviders.hpp`
- `src/providers/MockInterviewProviders.cpp`

职责：
- 模拟一个流式面试官
- 在没有真实 LLM 接入时，保证整条链路可运行

成员：

```cpp
int m_chunkSize;
int m_chunkDelayMs;
int m_referenceRevealThreshold;
std::string m_defaultProviderName;
```

默认值：
- `m_chunkSize = 15`
- `m_chunkDelayMs = 500`
- `m_referenceRevealThreshold = 3`
- `m_defaultProviderName = "MockProvider"`

#### 8.2.1 `streamFeedback()`

核心流程：

1. 验证请求必填字段。
2. 检查是否取消。
3. 根据请求构造回复文本。
4. 把回复文本切成多个 chunk。
5. 每个 chunk 通过 callback 发送。
6. 每个 chunk 之间 sleep 模拟生成延迟。
7. 发送 `Done` 事件。

#### 8.2.2 `validateRequest()`

直接检查请求里是否缺少：
- `sessionId`
- `messageId`
- `threadId`
- `topic`
- `questionTitle`
- `questionPrompt`
- `answer`
- `prompt`
- `topicLabel`

#### 8.2.3 `shouldCancel()`

当前只看：
- `context != nullptr`
- `context->cancelFlag == true`

如果用户或外部逻辑未来需要中断流式生成，可以在这里接入。

#### 8.2.4 回复文本生成

`buildReplyText()` 会根据请求选一种回复风格：

- `followup`
- `corrective`
- `guided`

如果满足“强制展示参考答案”条件，则优先走参考答案分支：

- `forceRevealReferenceAnswer == true`
- 或 `unknownAnswerStreak >= m_referenceRevealThreshold`

具体文案函数：

- `buildFollowupReply()`
- `buildCorrectiveReply()`
- `buildGuidedReply()`
- `buildReferenceAnswerReply()`

#### 8.2.5 `buildSourceContextBlock()`

作用：
- 把可选的资料上下文拼进回复

会把下面这些内容附加到文本里：
- `sourceContext`
- `sourceDocumentName`
- `sourceDocumentSummary`
- `sourceDocumentTags`

#### 8.2.6 chunk 输出

`splitTextToChunks()` 以固定长度切分字符串。

然后通过：
- `emitChunk()`
- `emitDone()`
- `emitError()`

统一组装 `InterviewStreamEvent`。

当前定位：
- 它是一个“规则拼接 + 模拟流式输出”的 provider。
- 还不是真正的 LLM provider。

---

## 9. 存储层

### 9.1 `ISessionRepository`

文件：
- `include/repositories/ISessionRepository.hpp`

职责：
- 定义会话存储接口
- 让 service 不依赖具体存储实现

接口：

```cpp
virtual bool recordUserMessage(const InterviewStreamRequest& request) = 0;
virtual bool recordAssistantMessage(const InterviewStreamRequest& request, const std::string& assistantContent) = 0;
virtual std::vector<InterviewSessionSummary> listSessions() = 0;
virtual std::optional<InterviewSessionDetail> getSession(const std::string& sessionId, const std::string& threadId) = 0;
virtual std::vector<InterviewSessionDetail> listSessionsBySessionId(const std::string& sessionId) = 0;
virtual void clearAll() = 0;
```

说明：
- 这是接口设计。
- 当前真正使用的是 `JsonSessionRepository`，但它并没有显式继承这个接口。

### 9.2 `JsonSessionRepository`

文件：
- `include/repositories/JsonSessionRepository.hpp`
- `src/repositories/JsonSessionRepository.cpp`

职责：
- 用本地 JSON 文件保存会话
- 提供会话列表、会话详情、清空历史
- 在程序启动时自动加载已有历史

成员：

```cpp
std::vector<InterviewSessionDetail> m_sessions;
std::unordered_map<std::string, size_t> m_index;
InterviewMessage latestUserMessage;
InterviewMessage latestAssistantMessage;
int messageCount = 0;
std::string m_filePath;
```

#### 9.2.1 构造逻辑

构造时做两件事：

1. `ensureStorageDir()`
2. `loadFromFile()`

然后重建内存索引：
- key: `sessionId:threadId`
- value: `m_sessions` 下标

#### 9.2.2 `recordUserMessage()`

作用：
- 记录用户消息
- 如果会话已存在，追加消息
- 如果会话不存在，创建新会话

行为细节：

- 从 `request.answer` 取用户输入，存为 `InterviewMessageRole::User`
- 更新：
  - `topic`
  - `questionTitle`
  - `feedbackStyle`
  - `updatedAt`
- 新会话会设置：
  - `createdAt`
  - `updatedAt`
  - `messageCount = 1`

最后会立即 `persistToFile()`。

#### 9.2.3 `recordAssistantMessage()`

作用：
- 把 assistant 的完整回复追加到对应会话

行为细节：

- 找不到对应会话时返回 `false`
- 找到时追加一条 `InterviewMessageRole::Assistant`
- 更新 `updatedAt`
- 然后立即持久化

#### 9.2.4 `listSessions()`

作用：
- 返回会话摘要列表

实现方式：
- 遍历 `m_sessions`
- 逐个调用 `toSummary()`

摘要中包含：
- `sessionId`
- `threadId`
- `topic`
- `questionTitle`
- `feedbackStyle`
- `messageCount`
- `latestUserMessage`
- `latestAssistantMessage`
- `createdAt`
- `updatedAt`

#### 9.2.5 `getSession()`

作用：
- 按 `sessionId + threadId` 查询会话详情

返回：
- 找到则返回 `InterviewSessionDetail`
- 找不到返回 `std::nullopt`

#### 9.2.6 `listSessionsBySessionId()`

作用：
- 返回同一个 `sessionId` 下的所有 thread 详情

当前问题：
- 上层 service/controller 还没使用这个能力。

#### 9.2.7 `clearAll()`

作用：
- 清空所有会话
- 立即持久化到文件

#### 9.2.8 `loadFromFile()`

作用：
- 从 JSON 文件恢复会话数据

恢复逻辑：

1. 检查文件是否存在。
2. 打开文件读取 JSON。
3. 如果 JSON 解析失败，清空内存数据。
4. 要求根节点存在 `sessions` 数组。
5. 遍历数组，恢复：
   - 基本字段
   - `feedbackStyle`
   - `messages`

#### 9.2.9 `persistToFile()`

作用：
- 将 `m_sessions` 原子化写回 JSON 文件

实现策略：

1. 先序列化到临时文件 `.tmp`
2. 写入成功后再替换正式文件

这是一个简单的“先写临时文件再替换”的安全写法，避免中途写坏原文件。

#### 9.2.10 `getCurrentTimestamp()`

作用：
- 生成 ISO 8601 UTC 时间字符串

格式：
- `YYYY-MM-DDTHH:MM:SSZ`

---

## 10. 数据模型

### 10.1 `CommonTypes`

文件：
- `include/types/CommonTypes.hpp`

这里定义了整套后端通用枚举：

```cpp
enum class InterviewMessageRole { User, Assistant };
enum class InterviewFeedbackStyle { Followup, Corrective, Guided };
enum class InterviewMessageFormat { Plain, Markdown };
enum class InterviewStreamEventType { Chunk, Done, Error };
enum class ApiErrorCode {
    InvalidRequest,
    SessionNotFound,
    ReportNotFound,
    InternalError,
    StorageError,
    ProviderError,
    LLMParseFailed
};
```

以及两个通用结构：

- `ApiError`
- `TimestampedRecord`

### 10.2 `InterviewTypes`

文件：
- `include/types/InterviewTypes.hpp`

这是当前 HTTP 面试链路最重要的数据结构。

#### 10.2.1 `InterviewMessage`

单条消息：
- `role`
- `content`
- `createdAt`

#### 10.2.2 `InterviewSessionSummary`

会话摘要：
- 继承 `TimestampedRecord`
- 包含 session/thread/topic/questionTitle
- 包含 `feedbackStyle`
- 包含 `messageCount`
- 包含最新用户/助手消息

#### 10.2.3 `InterviewSessionDetail`

会话详情：
- 继承 `InterviewSessionSummary`
- 多一个 `messages` 列表

#### 10.2.4 `InterviewStreamOptions`

流式请求的可选参数：
- `feedbackStyle`
- `format`
- `questionIndex`
- `questionCount`
- `unknownAnswerStreak`
- `forceRevealReferenceAnswer`
- `referenceAnswerHint`

#### 10.2.5 `InterviewStreamRequest`

当前流式接口请求体。

包含：
- 必填的会话和题目上下文
- 可选的资料上下文
- `options`

#### 10.2.6 `InterviewStreamEvent`

统一的流式事件：
- `Chunk`
- `Done`
- `Error`

### 10.3 `ReportTypes`

文件：
- `include/types/ReportTypes.hpp`

这套类型主要对应旧报告链路和未来报告重构。

重点类型：
- `PracticePlanSnapshot`
- `InterviewReportEntity`
- `InterviewReportSummary`
- `GenerateReportRequest`
- `GenerateReportResult`

说明：
- 它们体现的是“报告页应该有的结构”。
- 但当前 C++ HTTP 链路里还没有完整实现报告生成服务。

### 10.4 `PracticePoolTypes`

文件：
- `include/types/PracticePoolTypes.hpp`

这套类型是“题池/练习计划”的结构化定义，和前端概念保持一致。

重点类型：

- `PracticePoolPlan`
- `PracticeQuestionReview`
- `PracticeQuestionItem`
- `PracticeQuestionPool`
- `GeneratePracticePoolRequest`
- `GeneratePracticePoolResult`

说明：
- 目前它们是数据结构预留。
- 业务链路还没有接到 C++ HTTP 侧。

---

## 11. DTO 层

### 11.1 `Interview Stream DTO`

文件：
- `include/DTO/Interview Stream DTO.hpp`

这里是偏接口层的请求/响应 DTO。

它和 `InterviewTypes.hpp` 的区别是：
- `types` 更偏内部核心模型
- `DTO` 更偏 HTTP / 传输层

当前文件里包含：
- `InterviewStreamRequestDto`
- `InterviewStreamChunkEventDto`
- `InterviewStreamDoneEventDto`
- `InterviewStreamErrorEventDto`

### 11.2 `Report DTO`

文件：
- `include/DTO/Report DTO.hpp`

它定义了报告页的 HTTP 传输结构，包括：
- 报告详情
- 报告列表项
- 生成报告请求/响应
- `PracticePlanSnapshotDto`

### 11.3 `Practical Pool DTO`

文件：
- `include/DTO/Practical Pool DTO.hpp`

它定义了练习题池的 HTTP 传输结构，包括：
- `PracticePoolPlanInputDto`
- `PracticePoolQuestionReviewInputDto`
- `GeneratePracticePoolRequestDto`
- `PracticeQuestionItemDto`
- `PracticeQuestionPoolDto`
- `GeneratePracticePoolResponseDto`

这套 DTO 和前端 `practice-pool` 类型对应得比较完整，但当前 C++ 还没有把它接成实际 API。

---

## 12. 旧报告链路

### 12.1 `InterviewReport`

文件：
- `include/InterviewReport.hpp`

这是旧 MySQL 报告链路使用的实体类。

字段包括：
- 报告主表字段
- 弱项标签
- 答案快照
- 建议关注
- `PracticePlan` 子表

文件底部还定义了 `nlohmann::json` 的 `from_json()` 支持。

说明：
- 这个类型仍在用，但只在旧报告链路中用。
- 和新的 HTTP 面试会话链路是分开的。

### 12.2 `MySQLConn`

文件：
- `include/MySQLConn.hpp`
- `src/MySQLConn.cpp`

职责：
- 封装 MySQL C API
- 处理连接、查询、更新、事务、回滚、取值

主要方法：

```cpp
bool connect(...);
bool update(const std::string& sql);
bool query(const std::string& sql);
bool next();
std::string value(int index);
bool transaction();
bool commit();
bool rollback();
```

实现特点：

- `query()` 会先释放旧结果集，再执行 SQL。
- `next()` 遍历查询结果行。
- `value()` 读取当前行指定列。
- `transaction()` 实际上是关闭 autocommit。
- `commit()` / `rollback()` 直接调用 MySQL API。

注意：
- 当前实现大量直接拼接 SQL 字符串。
- 这部分有明显的 SQL 注入风险。

### 12.3 `ReportRepository`

文件：
- `include/ReportRepository.hpp`
- `src/ReportRepository.cpp`

职责：
- 操作旧报告相关表
- 负责主表和子表的写入、查询、删除

主方法：

```cpp
bool insertReport(const InterviewReport& report);
bool updateReport(const InterviewReport& report);
std::vector<InterviewReport> getReportBySessionId(const std::string& sessionId);
std::vector<InterviewReport> listReports(int userId);
bool deleteReport(const std::string& sessionId);
```

子表方法：

```cpp
bool insertWeaknessTags(...);
bool insertAnswerSnapshots(...);
bool insertSuggestedFocus(...);
bool insertPracticePlans(...);
bool clearSubTables(...);
```

实现逻辑：

- `insertReport()` / `updateReport()` 都使用事务。
- 先操作 `interview_reports` 主表。
- 再写子表：
  - `report_weakness_tags`
  - `report_answer_snapshots`
  - `report_suggested_focus`
  - `report_practice_plans`
- 任一步失败就回滚。

当前问题：
- SQL 都是字符串拼接，安全性较差。
- `getReportBySessionId()` 目前只返回第一条匹配记录。
- 这条链路没有和新的 HTTP 控制器打通。

### 12.4 `ReportCommandHandler`

文件：
- `include/ReportCommandHandler.hpp`
- `src/ReportCommandHandler.cpp`

职责：
- 旧 CLI 报告命令入口
- 解析 JSON 字符串
- 调用 `ReportRepository`
- 生成统一 JSON 响应

主要命令：

```cpp
handleInsert()
handleUpdate()
handleGet()
handleList()
handleDelete()
```

核心逻辑：

- `parseReportFromJson()` 把 JSON 转成 `InterviewReport`
- `reportToJson()` 把单个报告转回 JSON 字符串
- `reportsToJson()` 把报告列表转回 JSON 数组
- `successResponse()` / `errorResponse()` 包装统一响应格式

说明：
- 这是旧命令行模式下的实现。
- 现在 HTTP 面试链路启动后，它不会被调用。

---

## 13. 当前已经重构完成的功能

可以确认已经完成的有：

- 健康检查
- 面试流式回复
- SSE 输出
- 会话记录落盘
- 会话列表
- 会话详情
- 清空历史
- Mock provider 流式生成

---

## 14. 仍未完成的功能

当前还没有真正接上的有：

- 报告生成 HTTP 接口
- 报告详情 / 报告列表接口
- 创建会话接口
- 手动发送消息接口
- 真实 LLM provider
- 练习题池生成 API
- 练习计划落地服务
- 报告与题池闭环的后端化

---

## 15. 你后续重构时的理解方式

建议按这个边界理解：

- `HttpServer`
  - 负责“跑起来”
- `InterviewRoutes`
  - 负责“把路由挂上去”
- `InterviewController`
  - 负责“接 HTTP 和回 HTTP”
- `InterviewService`
  - 负责“业务编排”
- `InterviewProvider`
  - 负责“怎么生成回复”
- `JsonSessionRepository`
  - 负责“怎么存会话”

旧报告/MySQL 线可以先看成遗留能力，不要和当前面试流式链路混在一起。


# Backend C++ 类型结构说明

> 这份文档用于理解 `include/types/` 目录下的结构体和枚举。
> 这些类型大多是“数据载体”，本身不负责业务逻辑。

## 1. 先看几个基础概念

### `struct`
`struct` 用来保存一组相关数据。和 `class` 类似，但默认成员是 `public`，更适合做纯数据对象。

### `enum class`
强类型枚举。比如：
- `InterviewMessageRole::User`
- `InterviewMessageRole::Assistant`

它比普通枚举更安全，避免命名冲突。

### `std::optional<T>`
表示“这个字段可能有值，也可能没有值”。

例如：
- `std::optional<std::string>`：可能存在，也可能为空
- `std::optional<int>`：可能存在，也可能为空

### 继承
一些结构体会继承 `TimestampedRecord`，表示它们都带有创建时间和更新时间。

---

## 2. `CommonTypes.hpp`

这个文件放的是全项目通用的枚举和基础结构。

### 2.1 `InterviewMessageRole`
表示消息是谁发的。

```cpp
enum class InterviewMessageRole {
    User,
    Assistant
};
```

字段含义：
- `User`：用户消息
- `Assistant`：AI/助手消息

用途：
- 记录面试会话里的消息来源
- 在列表页面区分左右气泡或颜色

### 2.2 `InterviewFeedbackStyle`
表示回答反馈的风格。

```cpp
enum class InterviewFeedbackStyle {
    Followup,
    Corrective,
    Guided
};
```

字段含义：
- `Followup`：追问式
- `Corrective`：纠正式
- `Guided`：引导式

用途：
- `MockInterviewProvider` 会根据这个值生成不同风格的回复

### 2.3 `InterviewMessageFormat`
表示输出格式。

```cpp
enum class InterviewMessageFormat {
    Plain,
    Markdown
};
```

字段含义：
- `Plain`：纯文本
- `Markdown`：Markdown 格式

用途：
- 决定回答内容是否需要格式化

### 2.4 `InterviewStreamEventType`
表示流式输出事件类型。

```cpp
enum class InterviewStreamEventType {
    Chunk,
    Done,
    Error
};
```

字段含义：
- `Chunk`：一段内容
- `Done`：流式结束
- `Error`：发生错误

用途：
- SSE 流式接口里给前端推送事件

### 2.5 `ApiErrorCode`
表示统一错误码。

```cpp
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

字段含义：
- `InvalidRequest`：请求参数不合法
- `SessionNotFound`：找不到会话
- `ReportNotFound`：找不到报告
- `InternalError`：内部错误
- `StorageError`：存储失败
- `ProviderError`：provider 调用失败
- `LLMParseFailed`：AI 返回内容解析失败

### 2.6 `ApiError`
统一错误结构。

```cpp
struct ApiError {
    ApiErrorCode code;
    std::string message;
};
```

字段含义：
- `code`：错误类别
- `message`：错误说明

用途：
- 服务层、provider、controller 之间统一传递错误

### 2.7 `TimestampedRecord`
带时间戳的基础结构。

```cpp
struct TimestampedRecord {
    std::string createdAt;
    std::string updatedAt;
};
```

字段含义：
- `createdAt`：创建时间
- `updatedAt`：更新时间

用途：
- 被会话摘要、报告摘要等结构体继承

---

## 3. `InterviewTypes.hpp`

这个文件是“面试功能”核心数据结构。

### 3.1 `InterviewMessage`
单条消息。

```cpp
struct InterviewMessage {
    InterviewMessageRole role;
    std::string content;
    std::string createdAt;
};
```

字段含义：
- `role`：消息来源，用户还是助手
- `content`：消息内容
- `createdAt`：消息创建时间

用途：
- 存储在一个会话的 `messages` 列表中

### 3.2 `InterviewSessionSummary`
会话摘要，用于列表页。

```cpp
struct InterviewSessionSummary : public TimestampedRecord {
    std::string sessionId;
    std::string threadId;
    std::string topic;
    std::string questionTitle;
    std::optional<InterviewFeedbackStyle> feedbackStyle;
    int messageCount = 0;
    std::optional<std::string> latestUserMessage;
    std::optional<std::string> latestAssistantMessage;
};
```

字段含义：
- `sessionId`：会话 ID
- `threadId`：线程 ID
- `topic`：面试主题
- `questionTitle`：当前题目标题
- `feedbackStyle`：反馈风格，可空
- `messageCount`：消息数量
- `latestUserMessage`：最新用户消息，可空
- `latestAssistantMessage`：最新助手消息，可空
- `createdAt` / `updatedAt`：继承自 `TimestampedRecord`

用途：
- 列表页只需要摘要，不需要整段消息

### 3.3 `InterviewSessionDetail`
会话详情。

```cpp
struct InterviewSessionDetail : public InterviewSessionSummary {
    std::vector<InterviewMessage> messages;
};
```

字段含义：
- 继承 `InterviewSessionSummary` 的全部字段
- `messages`：完整消息列表

用途：
- 详情页、回放页

### 3.4 `InterviewStreamOptions`
流式请求的可选参数。

```cpp
struct InterviewStreamOptions {
    std::optional<InterviewFeedbackStyle> feedbackStyle;
    std::optional<InterviewMessageFormat> format;
    std::optional<int> questionIndex;
    std::optional<int> questionCount;
    std::optional<int> unknownAnswerStreak;
    bool forceRevealReferenceAnswer = false;
    std::optional<std::string> referenceAnswerHint;
};
```

字段含义：
- `feedbackStyle`：反馈风格
- `format`：输出格式
- `questionIndex`：当前题目序号
- `questionCount`：题目总数
- `unknownAnswerStreak`：连续不会答的次数
- `forceRevealReferenceAnswer`：是否强制展示参考答案
- `referenceAnswerHint`：参考答案提示

用途：
- 让 provider 根据上下文决定怎么回答

### 3.5 `InterviewStreamRequest`
流式面试请求主结构。

```cpp
struct InterviewStreamRequest {
    std::string sessionId;
    std::string messageId;
    std::string threadId;
    std::string topic;
    std::string topicLabel;
    std::string prompt;
    std::string questionTitle;
    std::string questionPrompt;
    std::string answer;

    std::optional<std::string> sourceContext;
    std::optional<std::string> sourceDocumentName;
    std::optional<std::string> sourceDocumentSummary;
    std::optional<std::vector<std::string>> sourceDocumentTags;
    std::optional<std::string> sourceDocumentExcerpt;

    InterviewStreamOptions options;
};
```

字段含义：
- 必填字段：
  - `sessionId`：会话 ID
  - `messageId`：消息 ID
  - `threadId`：线程 ID
  - `topic`：面试主题
  - `topicLabel`：主题标签
  - `prompt`：提示词
  - `questionTitle`：题目标题
  - `questionPrompt`：题目提示
  - `answer`：用户回答
- 可选字段：
  - `sourceContext`：来源上下文
  - `sourceDocumentName`：来源文档名
  - `sourceDocumentSummary`：来源文档摘要
  - `sourceDocumentTags`：来源文档标签
  - `sourceDocumentExcerpt`：来源文档片段
- `options`：补充控制参数

用途：
- `InterviewController` 负责从 JSON 组装它
- `InterviewService` 负责校验并向下传递

### 3.6 SSE 事件结构

```cpp
struct InterviewStreamChunkEvent {
    InterviewStreamEventType type = InterviewStreamEventType::Chunk;
    std::string content;
};

struct InterviewStreamDoneEvent {
    InterviewStreamEventType type = InterviewStreamEventType::Done;
};

struct InterviewStreamErrorEvent {
    InterviewStreamEventType type = InterviewStreamEventType::Error;
    ApiError error;
};
```

用途：
- 用于分阶段表达流式事件

### 3.7 `InterviewStreamEvent`
统一流式事件结构。

```cpp
struct InterviewStreamEvent {
    InterviewStreamEventType type;
    std::optional<std::string> content;
    std::optional<ApiError> error;
};
```

字段含义：
- `type`：事件类型
- `content`：chunk 内容，可空
- `error`：错误内容，可空

用途：
- provider 和 service 之间传递事件

---

## 4. `ReportTypes.hpp`

这个文件是“面试报告”相关结构。

### 4.1 `PracticePlanSnapshot`
练习计划快照。

```cpp
struct PracticePlanSnapshot {
    std::string weaknessTag;
    std::string questionType;
    std::string difficulty;
    std::string zone;
};
```

字段含义：
- `weaknessTag`：薄弱标签
- `questionType`：题型
- `difficulty`：难度
- `zone`：训练区域/方向

### 4.2 `InterviewReportEntity`
报告主实体。

```cpp
struct InterviewReportEntity : public TimestampedRecord {
    std::string id;
    std::string sessionId;
    std::optional<std::string> threadId;
    std::string topic;
    std::string source;
    std::optional<std::string> sourceDocumentId;
    std::optional<std::string> sourceDocumentName;
    std::optional<std::string> questionTitle;
    std::string summaryHeadline;
    std::string summaryBody;
    std::vector<std::string> weaknessTags;
    std::optional<std::string> primaryWeakness;
    std::optional<std::vector<std::string>> weaknessFocusAreas;
    int answeredCount = 0;
    int totalCount = 0;
    std::optional<std::vector<std::string>> answerSnapshot;
    std::optional<std::vector<std::string>> suggestedFocus;
    std::optional<PracticePlanSnapshot> practicePlan;
};
```

字段含义：
- `id`：报告 ID
- `sessionId`：所属会话 ID
- `threadId`：所属线程 ID，可空
- `topic`：报告主题
- `source`：来源
- `sourceDocumentId`：来源文档 ID，可空
- `sourceDocumentName`：来源文档名称，可空
- `questionTitle`：题目标题，可空
- `summaryHeadline`：摘要标题
- `summaryBody`：摘要正文
- `weaknessTags`：薄弱标签列表
- `primaryWeakness`：主要薄弱点，可空
- `weaknessFocusAreas`：重点关注领域，可空
- `answeredCount`：已回答题目数
- `totalCount`：总题目数
- `answerSnapshot`：答案快照，可空
- `suggestedFocus`：建议关注方向，可空
- `practicePlan`：练习计划快照，可空
- `createdAt` / `updatedAt`：时间戳

### 4.3 `InterviewReportSummary`
报告摘要，用于列表页。

```cpp
struct InterviewReportSummary : public TimestampedRecord {
    std::string id;
    std::string sessionId;
    std::optional<std::string> threadId;
    std::string topic;
    std::optional<std::string> questionTitle;
    std::string summaryHeadline;
    int answeredCount = 0;
    int totalCount = 0;
    std::vector<std::string> weaknessTags;
};
```

用途：
- 列表页展示报告时使用

### 4.4 `GenerateReportRequest`
生成报告请求。

```cpp
struct GenerateReportRequest {
    std::string sessionId;
    std::optional<std::string> topic;
    std::optional<std::string> source;
    std::optional<std::string> sourceDocumentId;
    std::optional<std::string> sourceDocumentName;
    std::optional<int> answeredCount;
    std::optional<int> totalCount;
    std::optional<std::vector<std::string>> weaknessTags;
    std::optional<std::string> primaryWeakness;
};
```

用途：
- 报告生成接口入参

### 4.5 `GenerateReportResult`
生成报告结果。

```cpp
struct GenerateReportResult {
    InterviewReportEntity report;
    bool created = false;
};
```

用途：
- 返回是否新建了报告

### 4.6 `ReportGenerationContext`
报告生成上下文。

```cpp
struct ReportGenerationContext {
    std::string sessionId;
};
```

用途：
- 预留给后续扩展，方便传递上下文数据

### 4.7 `ReportAnalysisResult`
报告分析结果。

```cpp
struct ReportAnalysisResult {
    std::string summaryHeadline;
    std::string summaryBody;
    std::vector<std::string> weaknessTags;
    std::optional<std::string> primaryWeakness;
};
```

用途：
- 内部分析后形成结构化结果，再映射成报告实体

---

## 5. `PracticePoolTypes.hpp`

这个文件是“练习题池”相关结构。

### 5.1 枚举

```cpp
enum class PracticeDifficulty { Easy, Medium, Hard };
enum class PracticeQuestionType { Concept, Code, Scenario };
enum class PracticeFocusArea { Structure, CaseDetail, ResultMetric, PrincipleDepth };
enum class PracticePoolStatus { Idle, Preparing, Ready, Error };
enum class PracticeQuestionSource { Llm, Mock };
```

含义：
- `PracticeDifficulty`：题目难度
- `PracticeQuestionType`：题目类型
- `PracticeFocusArea`：练习聚焦点
- `PracticePoolStatus`：题池状态
- `PracticeQuestionSource`：题目来源

### 5.2 `PracticePoolPlan`
题池生成计划。

```cpp
struct PracticePoolPlan {
    std::string weaknessTag;
    std::optional<PracticeFocusArea> focusArea;
    std::string zone;
    PracticeQuestionType questionType;
    int questionCount = 0;
    PracticeDifficulty difficulty;
    std::optional<std::string> reason;
};
```

### 5.3 `PracticeQuestionReview`
题目回顾。

```cpp
struct PracticeQuestionReview {
    std::optional<std::string> questionId;
    std::string questionTitle;
    std::string userAnswer;
    std::optional<std::string> aiFeedback;
};
```

### 5.4 `PracticeQuestionItem`
单道练习题。

```cpp
struct PracticeQuestionItem {
    std::string id;
    std::string sessionId;
    int order = 0;
    std::string title;
    std::string prompt;
    PracticeDifficulty difficulty;
    PracticeQuestionType questionType;
    PracticeQuestionSource generatedBy;
    std::optional<std::vector<PracticeFocusArea>> focusAreas;
    std::optional<std::string> referenceAnswer;
    std::optional<std::string> weaknessTag;
    std::optional<std::string> sourceQuestionId;
};
```

### 5.5 `PracticeQuestionPool`
整个题池。

```cpp
struct PracticeQuestionPool {
    std::string sessionId;
    std::string reportId;
    PracticePoolPlan planSnapshot;
    std::optional<std::string> reportSignature;
    std::vector<PracticeQuestionItem> questions;
    std::string preparedAt;
    PracticePoolStatus status;
    std::optional<std::string> errorMessage;
};
```

### 5.6 `GeneratePracticePoolRequest`
生成题池请求。

```cpp
struct GeneratePracticePoolRequest {
    std::string sessionId;
    std::optional<std::string> reportId;
    int questionCount = 0;
    PracticePoolPlan plan;
    std::optional<std::vector<PracticeQuestionReview>> questionReviews;
    std::optional<std::string> sourceDocumentId;
    std::optional<std::string> sourceDocumentName;
    std::optional<std::string> sourceDocumentSummary;
    std::optional<std::vector<std::string>> sourceDocumentTags;
    std::optional<std::string> sourceDocumentExcerpt;
    std::optional<std::string> reportSignature;
    std::optional<std::string> summaryBody;
    std::optional<std::vector<std::string>> weaknessTags;
};
```

### 5.7 `GeneratePracticePoolResult`
生成题池结果。

```cpp
struct GeneratePracticePoolResult {
    PracticeQuestionPool pool;
    int requestedCount = 0;
    int actualCount = 0;
    bool isShortfall = false;
};
```

---

## 6. `ConfigTypes.hpp`

这个文件是后端配置结构。

### 6.1 `DatabaseConfig`

```cpp
struct DatabaseConfig {
    std::string host;
    uint16_t port = 3306;
    std::string user;
    std::string password;
    std::string database;
};
```

含义：
- `host`：数据库地址
- `port`：数据库端口
- `user`：用户名
- `password`：密码
- `database`：数据库名

### 6.2 `ProviderConfig`

```cpp
struct ProviderConfig {
    std::string type;
    std::string endpoint;
    std::string apiKey;
    std::string model;
    int maxTokens = 1024;
};
```

含义：
- `type`：provider 类型，比如 `mock` / `remote`
- `endpoint`：服务地址
- `apiKey`：API Key
- `model`：模型名
- `maxTokens`：最大输出 token

### 6.3 `BackendConfig`

```cpp
struct BackendConfig {
    uint16_t httpPort = 8080;
    std::string storageDir;
    std::string logLevel;
    DatabaseConfig database;
    ProviderConfig provider;
};
```

含义：
- `httpPort`：HTTP 服务端口
- `storageDir`：本地存储目录
- `logLevel`：日志级别
- `database`：数据库配置
- `provider`：AI provider 配置

---

## 7. 这些类型在后端里的实际流向

### 面试流式接口
1. 前端发 JSON
2. `InterviewController` 解析成 `InterviewStreamRequest`
3. `InterviewService` 校验请求
4. `JsonSessionRepository` 保存用户消息
5. `InterviewProvider` 生成 `InterviewStreamEvent`
6. `InterviewController` 把事件转成 SSE 输出
7. `JsonSessionRepository` 保存助手消息

### 报告功能
1. 业务层从会话中提取信息
2. 组装 `GenerateReportRequest`
3. 生成 `ReportAnalysisResult`
4. 映射成 `InterviewReportEntity`
5. 返回 `InterviewReportSummary` 给列表页

---

## 8. 新手记忆法

- `CommonTypes`：全局基础枚举和错误结构
- `InterviewTypes`：面试会话、流式请求、流式事件
- `ReportTypes`：报告生成和展示
- `PracticePoolTypes`：练习题池
- `ConfigTypes`：配置

如果你先只做面试链路，最重要的是：
- `InterviewStreamRequest`
- `InterviewStreamEvent`
- `InterviewSessionDetail`
- `ApiError`

---

## 9. 报告生成补充说明

这一段专门给 `GenerateReportRequest` 和 `ReportPromptBuilder` 用。你现在要做的事情，不是“让 AI 随便写”，而是先把输入结构固定下来，再把 prompt 约束住，最后再让 `ReportService` 去接 AI。

### 9.1 `GenerateReportRequest` 应该包含什么

建议最终结构是：
```cpp
struct ReportQuestionReview {
    std::string questionId;
    std::string questionTitle;
    std::string userAnswer;
    std::optional<std::string> referenceAnswer;
    std::optional<std::string> aiFeedback;
};

struct GenerateReportRequest {
    std::string sessionId;
    std::optional<std::string> topic;
    std::optional<std::string> source;
    std::optional<std::string> sourceDocumentId;
    std::optional<std::string> sourceDocumentName;
    std::optional<int> answeredCount;
    std::optional<int> totalCount;
    std::optional<std::vector<std::string>> weaknessTags;
    std::optional<std::string> primaryWeakness;
    std::optional<std::string> modelId;
    std::optional<std::string> summaryBody;
    std::optional<std::vector<std::string>> weaknessFocusAreas;
    std::optional<std::vector<std::string>> suggestedFocus;
    std::optional<std::string> sourceDocumentExcerpt;
    std::optional<std::vector<ReportQuestionReview>> questionReviews;
};
```

字段职责很明确：
- `sessionId`：报告主键来源，必填
- `topic`：主题标签，可选
- `source`：来源，可选
- `sourceDocumentId` / `sourceDocumentName`：资料定位信息
- `answeredCount` / `totalCount`：进度信息
- `weaknessTags` / `primaryWeakness`：弱项信息
- `modelId`：选择哪套模型配置
- `summaryBody`：前端本地摘要
- `weaknessFocusAreas`：弱项关注维度
- `suggestedFocus`：下一轮训练建议
- `sourceDocumentExcerpt`：资料片段
- `questionReviews`：逐题复盘输入



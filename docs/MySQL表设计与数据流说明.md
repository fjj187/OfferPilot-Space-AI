# MySQL 表设计与数据流说明

本文档说明 `OfferPilot-AI` 后端接入 MySQL 时的表结构、字段含义、表之间的关系，以及各表的创建与写入逻辑。

## 1. 设计目标

本次 MySQL 化的目标分为四类：

1. 用户登录信息持久化
2. 面试会话与消息持久化
3. 报告持久化
4. SSE 流式断点恢复数据持久化

当前代码里已经存在 `AuthService`、`InterviewService`、`ReportService` 和 `MySQLConn`，因此数据库设计应当优先适配现有 DTO 与仓储接口，而不是反向改造业务层。

## 2. 表结构总览

建议至少创建 5 张核心表：

1. `users`
2. `auth_sessions`
3. `interview_sessions`
4. `interview_messages`
5. `interview_reports`
6. `interview_stream_checkpoints`

其中：

- `users` 负责用户身份
- `auth_sessions` 负责 token 登录态
- `interview_sessions` 负责一轮会话的摘要信息
- `interview_messages` 负责会话中的每条消息
- `interview_reports` 负责报告结果
- `interview_stream_checkpoints` 负责 SSE 中断恢复

## 3. 各表说明

### 3.1 `users`

用途：登录校验、注册状态判断、账号启用/禁用。

字段建议：

- `id`
- `username`
- `password_hash`
- `salt`
- `display_name`
- `role`
- `enabled`
- `created_at`
- `updated_at`

关键约束：

- `username` 唯一
- `enabled` 用于禁用账号
- `password_hash + salt` 用于密码校验

### 3.2 `auth_sessions`

用途：保存登录后的 token 会话。

字段建议：

- `id`
- `token`
- `user_id`
- `username`
- `role`
- `display_name`
- `created_at`
- `expires_at`
- `revoked_at`
- `last_active_at`

关键约束：

- `token` 唯一
- `user_id` 外键关联 `users.id`
- 会话过期后可定期清理

### 3.3 `interview_sessions`

用途：保存一轮面试的主记录，供列表页和报告页引用。

字段建议：

- `id`
- `session_id`
- `user_id`
- `thread_id`
- `topic`
- `question_title`
- `feedback_style`
- `message_count`
- `latest_user_message`
- `latest_assistant_message`
- `created_at`
- `updated_at`

关键约束：

- `(session_id, thread_id)` 唯一
- `session_id` 建议也单独唯一，取决于你的前端会话模型

### 3.4 `interview_messages`

用途：保存会话中的所有 user / assistant 消息。

字段建议：

- `id`
- `session_id`
- `thread_id`
- `message_id`
- `role`
- `content`
- `format`
- `status`
- `sequence_no`
- `created_at`

关键约束：

- `message_id` 唯一
- `session_id + thread_id + created_at` 可做索引
- `session_id + thread_id + sequence_no` 可做回放排序

### 3.5 `interview_reports`

用途：保存报告结果和历史报告列表。

字段建议：

- `id`
- `report_id`
- `session_id`
- `thread_id`
- `user_id`
- `topic`
- `source`
- `model_id`
- `source_document_id`
- `source_document_name`
- `source_document_excerpt`
- `question_title`
- `summary_headline`
- `summary_body`
- `primary_weakness`
- `answered_count`
- `total_count`
- `weakness_tags`
- `weakness_focus_areas`
- `answer_snapshot`
- `question_reviews`
- `suggested_focus`
- `practice_plan`
- `created_at`
- `updated_at`

关键约束：

- `report_id` 唯一
- `session_id` 唯一，表示一轮 session 只有一份主报告
- JSON 字段用于承载数组和嵌套结构

### 3.6 `interview_stream_checkpoints`

用途：保存 SSE 流式中断时的恢复快照。

字段建议：

- `id`
- `session_id`
- `thread_id`
- `message_id`
- `idempotent_key`
- `user_id`
- `status`
- `content`
- `last_sequence`
- `created_at`
- `updated_at`
- `completed_at`
- `error_code`
- `error_message`

关键约束：

- `(session_id, thread_id, idempotent_key)` 唯一
- `status` 表示 `streaming / done / error / aborted`
- `content` 保存当前已生成文本

## 4. 建表顺序

建议按以下顺序建表：

1. `users`
2. `auth_sessions`
3. `interview_sessions`
4. `interview_messages`
5. `interview_reports`
6. `interview_stream_checkpoints`

原因是：

- `auth_sessions` 依赖 `users`
- `interview_sessions` 依赖 `users`
- `interview_messages` 依赖 `interview_sessions`
- `interview_reports` 依赖 `users` 和 `interview_sessions`
- `interview_stream_checkpoints` 依赖 `users`

## 5. 写入逻辑

### 5.1 登录

1. 前端提交 `username + password`
2. `AuthService` 调用用户仓储按用户名查用户
3. 判断 `enabled`
4. 使用 `salt + password_hash` 校验密码
5. 登录成功后生成 token
6. 将 token 写入 `auth_sessions`

### 5.2 面试流

1. 前端发起 `POST /api/interview/stream`
2. `InterviewService` 先写入用户消息
3. SSE 过程中持续更新 checkpoint
4. 完成后写入 assistant 消息
5. 形成 `interview_sessions + interview_messages` 的完整会话链路

### 5.3 报告生成

1. 根据 `session_id` 查会话
2. 查报告是否已存在
3. 调用 AI 生成报告或 fallback
4. upsert 到 `interview_reports`

### 5.4 断点恢复

1. 流式响应过程中写入 `interview_stream_checkpoints`
2. 页面刷新或连接中断时，前端可按 `session_id + thread_id + idempotent_key` 查询恢复内容
3. 若存在 checkpoint，则恢复已生成内容
4. 再由前端决定是否重新生成本轮反馈

## 6. 与当前 C++ 代码的对应关系

建议的仓储替换关系：

- `JsonAuthUserRepository` -> `MySQLAuthUserRepository`
- `JsonAuthSessionRepository` -> `MySQLAuthSessionRepository`
- `JsonSessionRepository` -> `MySQLSessionRepository`
- `JsonReportRepository` -> `MySQLReportRepository`
- 新增 `MySQLStreamCheckpointRepository`

服务层保持不变或少改：

- `AuthService`
- `InterviewService`
- `ReportService`

这样可以把修改集中在仓储层，降低对控制器和路由层的冲击。


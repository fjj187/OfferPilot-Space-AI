#pragma once
#include <string>

// ---------- 枚举 ----------

enum class InterviewMessageRole {
    User,
    Assistant
};

enum class InterviewFeedbackStyle {
    Followup,
    Corrective,
    Guided
};

enum class InterviewMessageFormat {
    Plain,
    Markdown
};

enum class InterviewStreamEventType {
    Chunk,
    Done,
    Error
};

enum class ApiErrorCode {
    InvalidRequest,
    SessionNotFound,
    ReportNotFound,
    InternalError,
    StorageError,
    ProviderError,
    LLMParseFailed
};

// ---------- 通用结构 ----------

struct ApiError {
    ApiErrorCode code;
    std::string message;
};

// 可给实体统一挂时间戳
struct TimestampedRecord {
    std::string createdAt;   // ISO 8601
    std::string updatedAt;   // ISO 8601
};


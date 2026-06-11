#pragma once
#include "CommonTypes.hpp"
#include <string>
#include <vector>
#include <optional>


// 单条消息
struct InterviewMessage {
    InterviewMessageRole role;
    std::string content;
    std::string createdAt;
};

// 会话摘要（列表项）
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

// 会话详情
struct InterviewSessionDetail : public InterviewSessionSummary {
    std::vector<InterviewMessage> messages;
};

// 流式请求选项
struct InterviewStreamOptions {
    std::optional<InterviewFeedbackStyle> feedbackStyle;
    std::optional<InterviewMessageFormat> format;
    std::optional<int> questionIndex;
    std::optional<int> questionCount;
    std::optional<int> unknownAnswerStreak;
    bool forceRevealReferenceAnswer = false;
    std::optional<std::string> referenceAnswerHint;
};

// 流式请求
struct InterviewStreamRequest {
    // 必填字段
    std::string sessionId;
    std::string messageId;
    std::string threadId;
    std::string topic;
    std::string topicLabel;
    std::string prompt;
    std::string questionTitle;
    std::string questionPrompt;
    std::string answer;

    // 可选字段
    std::optional<std::string> sourceContext;
    std::optional<std::string> sourceDocumentName;
    std::optional<std::string> sourceDocumentSummary;
    std::optional<std::vector<std::string>> sourceDocumentTags;
    std::optional<std::string> sourceDocumentExcerpt;

    // 选项子结构
    InterviewStreamOptions options;
};

// SSE 事件
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

// 统一流事件（简单联合体，实现阶段再细化）
struct InterviewStreamEvent {
    InterviewStreamEventType type;
    std::optional<std::string> content;
    std::optional<ApiError> error;
};

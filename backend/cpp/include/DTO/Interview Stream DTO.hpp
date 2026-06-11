#pragma once
#include <string>
#include<vector>

struct InterviewStreamRequestDto{
    std::string sessionId;//面试会话ID
    std::string messageId;//消息ID
    std::string threadId;//线程ID
    std::string topic;//面试话题
    std::string topicLabel;//面试话题标签
    std::string prompt;//面试问题提示语
    std::string questionTitle;//面试问题标题
    std::string questionPrompt;//面试问题提示语
    std::string answer;//面试问题答案

    // ---- 可选字段 ----
    std::string sourceContext;//源上下文
    std::string sourceDocumentName;//源文档名称
    std::string sourceDocumentSummary;//源文档摘要
    std::vector<std::string> sourceDocumentHighlights;//源文档亮点
    std::string sourceDocumentExcerpt;//源文档摘录

    std::string feedbackStyle;// feedbackStyle 可选值: "followup" | "corrective" | "guided"
    std::string format;// format 可选值: "plain" | "markdown"

    int questionIndex;//当前问题索引，从1开始
    int questionCount;//问题总数
    int unknownAnswerStreak;//未知答案连续次数
    bool forceRevealReferenceAnswer;//是否强制显示参考答案
    std::string referenceAnswerHint;//参考答案提示
};

// ========== SSE 事件 DTO ==========

// 流式数据块事件
struct InterviewStreamChunkEventDto {
    std::string type = "chunk";   // 事件类型, 固定值
    std::string content;          // 文本块内容
};

// 流结束事件
struct InterviewStreamDoneEventDto {
    std::string type = "done";    // 事件类型, 固定值
};

// 流错误事件
struct InterviewStreamErrorEventDto {
    std::string type = "error";   // 事件类型, 固定值
    std::string code;             // 错误码
    std::string message;          // 错误描述
};
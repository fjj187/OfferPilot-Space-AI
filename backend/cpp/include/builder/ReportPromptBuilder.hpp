#pragma once

#include <string>
#include "json.hpp"

#include "types/InterviewTypes.hpp"
#include "types/ReportTypes.hpp"

// 报告 prompt 构造器。
// 负责把面试会话整理成适合 AI 处理的系统提示词和用户提示词。
class ReportPromptBuilder {
public:
    // system prompt 负责约束模型输出结构和风格。
    std::string buildSystemPrompt() const;

    // user prompt 负责提供面试会话、复盘材料和补充信息。
    std::string buildUserPrompt(const InterviewSessionDetail& detail,
                                const GenerateReportRequest& request) const;
private:
    std::string buildMessageDigest(const InterviewSessionDetail& detail) const;
    std::string buildReviewDigest(const GenerateReportRequest& request) const;
    static std::string truncateText(const std::string& text, size_t maxLen);
};


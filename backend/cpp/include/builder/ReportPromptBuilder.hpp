#pragma once
#include <string>
#include "json.hpp"

#include "types/InterviewTypes.hpp"
#include "types/ReportTypes.hpp"

// 3) 提示词构造器：负责把会话转成给 AI 的 prompt
class ReportPromptBuilder {
public:
    std::string buildSystemPrompt() const;
    std::string buildUserPrompt(const InterviewSessionDetail& detail,
                                const GenerateReportRequest& request) const;
};

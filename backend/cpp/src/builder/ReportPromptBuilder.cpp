#include "builder/ReportPromptBuilder.hpp"

std::string ReportPromptBuilder::buildSystemPrompt() const {
    return R"(
你是一个面试复盘助手。
只输出严格 JSON，不要输出 markdown，不要输出解释文字。
必须返回这些字段：
summaryHeadline, summaryBody, weaknessTags, primaryWeakness,
answeredCount, totalCount, suggestedFocus, practicePlan
)";
}

std::string ReportPromptBuilder::buildUserPrompt(
    const InterviewSessionDetail& detail,
    const GenerateReportRequest& request) const {
    nlohmann::json j;
    j["sessionId"] = detail.sessionId;
    j["topic"] = detail.topic;
    j["questionTitle"] = detail.questionTitle;
    nlohmann::json messages = nlohmann::json::array();
    for (const auto& msg : detail.messages) {
        messages.push_back({
            {"role", msg.role == InterviewMessageRole::User ? "user" : "assistant"},
            {"content", msg.content},
            {"createdAt", msg.createdAt}
        });
    }
    j["messages"]=messages;
    j["request"] = {
        {"topic", request.topic},
        {"source", request.source},
        {"primaryWeakness", request.primaryWeakness}
    };
    return j.dump(2);
}
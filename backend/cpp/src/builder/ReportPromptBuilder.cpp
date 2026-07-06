#include "builder/ReportPromptBuilder.hpp"

#include <algorithm>

std::string ReportPromptBuilder::buildSystemPrompt() const {
    // 这里是硬约束：要求模型只输出 JSON，方便后续机器解析。
    return R"(
你是面试复盘报告生成器。你只能输出一个合法 JSON 对象。
禁止输出 markdown、代码块、注释、解释性文字。
必须包含字段：summaryHeadline, summaryBody, weaknessTags, primaryWeakness,
answeredCount, totalCount, suggestedFocus, practicePlan

JSON 结构：
{
  "summaryHeadline": "string",
  "summaryBody": "string",
  "weaknessTags": ["string"],
  "primaryWeakness": "string",
  "answeredCount": number,
  "totalCount": number,
  "suggestedFocus": ["string"],
  "practicePlan": {
    "weaknessTag": "string",
    "questionType": "concept|code|scenario",
    "difficulty": "easy|medium|hard",
    "zone": "vue|javascript|typescript|engineering|performance"
  }
}
)";
}

std::string ReportPromptBuilder::truncateText(const std::string& text, size_t maxLen) {
    if (text.size() <= maxLen) return text;
    return text.substr(0, maxLen);
}

std::string ReportPromptBuilder::buildMessageDigest(const InterviewSessionDetail& detail) const {
    // 只保留最近若干条消息，避免 prompt 过长。
    nlohmann::json arr = nlohmann::json::array();

    const size_t maxCount = 20;
    const size_t start = detail.messages.size() > maxCount ? detail.messages.size() - maxCount : 0;

    for (size_t i = start; i < detail.messages.size(); ++i) {
        const auto& msg = detail.messages[i];
        arr.push_back({
            {"role", msg.role == InterviewMessageRole::User ? "user" : "assistant"},
            {"content", truncateText(msg.content, 1200)},
            {"createdAt", msg.createdAt}
        });
    }

    return arr.dump(2);
}

namespace {
nlohmann::json toJson(const ReportQuestionReview& review) {
    nlohmann::json j;
    j["questionId"] = review.questionId;
    j["questionTitle"] = review.questionTitle;
    j["userAnswer"] = review.userAnswer;
    if (review.referenceAnswer.has_value()) j["referenceAnswer"] = *review.referenceAnswer;
    if (review.aiFeedback.has_value()) j["aiFeedback"] = *review.aiFeedback;
    return j;
}
}

std::string ReportPromptBuilder::buildReviewDigest(const GenerateReportRequest& request) const {
    // 控制复盘材料的数量，避免 prompt 被塞爆。
    nlohmann::json arr = nlohmann::json::array();

    if (!request.questionReviews.has_value()) {
        return arr.dump(2);
    }

    const auto& reviews = *request.questionReviews;
    const size_t maxCount = 8;
    const size_t count = std::min(maxCount, reviews.size());

    for (size_t i = 0; i < count; ++i) {
        arr.push_back(toJson(reviews[i]));
    }

    return arr.dump(2);
}

std::string ReportPromptBuilder::buildUserPrompt(
    const InterviewSessionDetail& detail,
    const GenerateReportRequest& request) const
{
    // 用户 prompt 用结构化 JSON，不用自然语言散文，便于模型稳定生成报告。
    nlohmann::json payload;

    payload["session"] = {
        {"sessionId", detail.sessionId},
        {"threadId", detail.threadId},
        {"topic", detail.topic},
        {"questionTitle", detail.questionTitle},
        {"messages", nlohmann::json::array()}
    };

    for (const auto& msg : detail.messages) {
        payload["session"]["messages"].push_back({
            {"role", msg.role == InterviewMessageRole::User ? "user" : "assistant"},
            {"content", truncateText(msg.content, 1200)},
            {"createdAt", msg.createdAt}
        });
    }

    payload["request"] = {
        {"topic", request.topic},
        {"source", request.source},
        {"sourceDocumentId", request.sourceDocumentId},
        {"sourceDocumentName", request.sourceDocumentName},
        {"answeredCount", request.answeredCount},
        {"totalCount", request.totalCount},
        {"weaknessTags", request.weaknessTags},
        {"primaryWeakness", request.primaryWeakness},
        {"modelId", request.modelId},
        {"summaryBody", request.summaryBody},
        {"weaknessFocusAreas", request.weaknessFocusAreas},
        {"suggestedFocus", request.suggestedFocus},
        {"sourceDocumentExcerpt", request.sourceDocumentExcerpt}
    };

    payload["messageDigest"] = buildMessageDigest(detail);
    payload["reviewDigest"] = buildReviewDigest(request);

    return payload.dump(2);
}


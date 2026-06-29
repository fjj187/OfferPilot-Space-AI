#pragma once
#include "CommonTypes.hpp"
#include <string>
#include <vector>
#include <optional>


// 练习计划快照（报告内嵌）
struct PracticePlanSnapshot {
    std::string weaknessTag;
    std::string questionType;
    std::string difficulty;
    std::string zone;
};

// 报告主体
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

// 报告列表项（摘要）
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

struct ReportQuestionReview {
    std::string questionId;
    std::string questionTitle;
    std::string userAnswer;
    std::optional<std::string> referenceAnswer;
    std::optional<std::string> aiFeedback;
};

// 生成报告请求
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

// 生成报告结果
struct GenerateReportResult {
    InterviewReportEntity report;
    bool created = false;
};

// 报告生成上下文（内部传递用，字段待实现阶段细化）
struct ReportGenerationContext {
    std::string sessionId;
    // 后续可添加完整的会话消息、文档等信息
};

// 报告分析结果（内部传递用）
struct ReportAnalysisResult {
    std::string summaryHeadline;
    std::string summaryBody;
    std::vector<std::string> weaknessTags;
    std::optional<std::string> primaryWeakness;
    // 后续可扩展更多分析字段
};

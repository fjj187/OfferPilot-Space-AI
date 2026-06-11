#pragma once
#include "ReportTypes.hpp"   // 引入 PracticePlanSnapshot
#include <string>
#include <vector>
#include <optional>


// ---------- 枚举 ----------

enum class PracticeDifficulty {
    Easy,
    Medium,
    Hard
};

enum class PracticeQuestionType {
    Concept,
    Code,
    Scenario
};

enum class PracticeFocusArea {
    Structure,
    CaseDetail,
    ResultMetric,
    PrincipleDepth
};

enum class PracticePoolStatus {
    Idle,
    Preparing,
    Ready,
    Error
};

enum class PracticeQuestionSource {
    Llm,
    Mock
};

// ---------- 结构体 ----------

// 练习计划输入
struct PracticePoolPlan {
    std::string weaknessTag;
    std::optional<PracticeFocusArea> focusArea;
    std::string zone;
    PracticeQuestionType questionType;
    int questionCount = 0;
    PracticeDifficulty difficulty;
    std::optional<std::string> reason;
};

// 题目复盘
struct PracticeQuestionReview {
    std::optional<std::string> questionId;
    std::string questionTitle;
    std::string userAnswer;
    std::optional<std::string> aiFeedback;
};

// 题池中的单道题目
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

// 题池整体
struct PracticeQuestionPool {
    std::string sessionId;
    std::string reportId;
    PracticePoolPlan planSnapshot;
    std::optional<std::string> reportSignature;
    std::vector<PracticeQuestionItem> questions;
    std::string preparedAt;   // ISO 8601
    PracticePoolStatus status;
    std::optional<std::string> errorMessage;
};

// 生成题池请求
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

// 生成题池结果
struct GeneratePracticePoolResult {
    PracticeQuestionPool pool;
    int requestedCount = 0;
    int actualCount = 0;
    bool isShortfall = false;
};

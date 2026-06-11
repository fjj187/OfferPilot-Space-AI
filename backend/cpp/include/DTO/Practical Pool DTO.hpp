#pragma once
#include <string>
#include <vector>

// 报告内嵌的练习计划快照
struct PracticePlanSnapshotDto {
    std::string weaknessTag;    // 弱项标签
    std::string questionType;   // 题目类型
    std::string difficulty;     // 难度
    std::string zone;           // 区域
};

// 单个补练计划输入
struct PracticePoolPlanInputDto {
    std::string weaknessTag;    // 弱项标签
    // focusArea 可选, 只允许 "structure" | "case_detail" | "result_metric" | "principle_depth"
    std::string focusArea;
    std::string zone;           // 区域
    // questionType 只允许 "concept" | "code" | "scenario"
    std::string questionType;
    int questionCount = 0;      // 题目数量
    // difficulty 只允许 "easy" | "medium" | "hard"
    std::string difficulty;
    std::string reason;         // 原因 (可选)
};

// 题目复盘输入
struct PracticePoolQuestionReviewInputDto {
    std::string questionId;     // 题目ID (可选)
    std::string questionTitle;  // 题目标题
    std::string userAnswer;     // 用户答案
    std::string aiFeedback;     // AI反馈 (可选)
};

// 生成题池请求
struct GeneratePracticePoolRequestDto {
    std::string sessionId;                                          // 会话ID
    std::string reportId;                                           // 报告ID (可选)
    int questionCount = 0;                                          // 请求题目数量
    PracticePoolPlanInputDto plan;                                  // 练习计划
    std::vector<PracticePoolQuestionReviewInputDto> questionReviews;// 题目复盘列表 (可选)
    std::string sourceDocumentId;                                   // 源文档ID (可选)
    std::string sourceDocumentName;                                 // 源文档名称 (可选)
    std::string sourceDocumentSummary;                              // 源文档摘要 (可选)
    std::vector<std::string> sourceDocumentTags;                    // 源文档标签 (可选)
    std::string sourceDocumentExcerpt;                              // 源文档摘录 (可选)
    std::string reportSignature;                                    // 报告签名 (可选)
    std::string summaryBody;                                        // 报告摘要正文 (可选)
    std::vector<std::string> weaknessTags;                          // 弱项标签列表 (可选)
};

// 题池中的单道题目
struct PracticeQuestionItemDto {
    std::string id;                  // 题目ID
    std::string sessionId;           // 所属会话ID
    int order = 0;                   // 顺序编号
    std::string title;               // 题目标题
    std::string prompt;              // 题目提示语
    std::string difficulty;          // 难度
    std::string questionType;        // 题目类型
    // generatedBy 只允许 "llm" | "mock"
    std::string generatedBy;
    std::vector<std::string> focusAreas;   // 关注领域 (可选)
    std::string referenceAnswer;           // 参考答案 (可选)
    std::string weaknessTag;               // 弱项标签 (可选)
    std::string sourceQuestionId;          // 来源题目ID (可选)
};

// 题池对象
struct PracticeQuestionPoolDto {
    std::string sessionId;                   // 会话ID
    std::string reportId;                    // 报告ID
    PracticePoolPlanInputDto planSnapshot;   // 计划快照
    std::string reportSignature;             // 报告签名 (可选)
    std::vector<PracticeQuestionItemDto> questions; // 题目列表
    std::string preparedAt;                  // 准备时间, ISO 8601
    // status 只允许 "idle" | "preparing" | "ready" | "error"
    std::string status;
    std::string errorMessage;                // 错误信息 (可选)
};

// 生成题池响应
struct GeneratePracticePoolResponseDto {
    PracticeQuestionPoolDto pool;  // 生成的题池
    int requestedCount = 0;        // 请求数量
    int actualCount = 0;           // 实际生成数量
    bool isShortfall = false;      // 是否数量不足
};
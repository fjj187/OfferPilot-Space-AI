#pragma once
#include "Practical Pool DTO.hpp"  // 引入 PracticePlanSnapshotDto
#include <string>
#include <vector>

// 报告主体 (详情)
struct InterviewReportDto {
    std::string id;                            // 报告ID
    std::string sessionId;                     // 会话ID
    std::string threadId;                      // 线程ID (可选)
    std::string topic;                         // 面试话题
    std::string source;                        // 来源
    std::string sourceDocumentId;              // 源文档ID (可选)
    std::string sourceDocumentName;            // 源文档名称 (可选)
    std::string questionTitle;                 // 问题标题 (可选)
    std::string summaryHeadline;               // 摘要标题
    std::string summaryBody;                   // 摘要正文
    std::vector<std::string> weaknessTags;     // 弱项标签
    std::string primaryWeakness;               // 主要弱项 (可选)
    std::vector<std::string> weaknessFocusAreas; // 弱项聚焦领域 (可选)
    int answeredCount = 0;                     // 已回答数量
    int totalCount = 0;                        // 题目总数
    std::vector<std::string> answerSnapshot;   // 答案快照 (可选)
    std::vector<std::string> suggestedFocus;   // 建议关注领域 (可选)
    PracticePlanSnapshotDto practicePlan;      // 练习计划快照 (可选)
    std::string createdAt;                     // 创建时间, ISO 8601
    std::string updatedAt;                     // 更新时间, ISO 8601
};

// 报告列表项
struct InterviewReportListItemDto {
    std::string id;                        // 报告ID
    std::string sessionId;                 // 会话ID
    std::string threadId;                  // 线程ID (可选)
    std::string topic;                     // 话题
    std::string questionTitle;             // 问题标题 (可选)
    std::string summaryHeadline;           // 摘要标题
    int answeredCount = 0;                 // 已回答数量
    int totalCount = 0;                    // 题目总数
    std::vector<std::string> weaknessTags; // 弱项标签
    std::string createdAt;                 // 创建时间
    std::string updatedAt;                 // 更新时间
};

// 报告列表响应
struct ListInterviewReportsResponseDto {
    std::vector<InterviewReportListItemDto> reports;
};

// 单报告响应
struct GetInterviewReportResponseDto {
    InterviewReportDto report;
};

// 生成报告请求
struct GenerateInterviewReportRequestDto {
    std::string sessionId;                    // 会话ID (必填)
    std::string topic;                        // 话题 (可选)
    std::string source;                       // 来源 (可选)
    std::string sourceDocumentId;             // 源文档ID (可选)
    std::string sourceDocumentName;           // 源文档名称 (可选)
    int answeredCount = 0;                    // 已回答数量 (可选)
    int totalCount = 0;                       // 题目总数 (可选)
    std::vector<std::string> weaknessTags;    // 弱项标签 (可选)
    std::string primaryWeakness;              // 主要弱项 (可选)
};

// 生成报告响应
struct GenerateInterviewReportResponseDto {
    InterviewReportDto report; // 生成的报告
    bool created = false;      // 是否新创建
};
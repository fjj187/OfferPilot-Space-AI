#pragma once
#include <iostream>
#include <string>
#include <vector>

/**
 * @brief 练习计划子结构，对应 report_practice_plans 子表
 */
struct PracticePlan {
    std::string weakness_tag;   // 弱项标签
    std::string question_type;  // 题目类型
    std::string difficulty;     // 难度
    std::string zone;           // 领域
};


class InterviewReport {
public:
    // ========== 主表字段 ==========
    std::string id;                     // 报告唯一 ID，如 report-xxx
    std::string session_id;             // 会话 ID
    int user_id;                        // 用户 ID
    std::string topic;                  // 主题
    std::string source;                 // 来源
    std::string source_document_id;     // 资料文档 ID（可选，可为空）
    std::string source_document_name;   // 资料文档名称（可选）
    std::string question_title;         // 题目名称（可选）
    std::string summary_headline;       // 报告标题
    std::string summary_body;           // 报告正文
    std::string primary_weakness;       // 主要弱项
    int answered_count;                 // 已答题数
    int total_count;                    // 总题数
    std::string created_at;             // 创建时间，ISO 8601 格式
    std::string updated_at;             // 更新时间

    // ========== 子表数据（一对多关系） ==========
    std::vector<std::string> weakness_tags;     // 对应 report_weakness_tags
    std::vector<std::string> answer_snapshots;  // 对应 report_answer_snapshots
    std::vector<std::string> suggested_focus;   // 对应 report_suggested_focus

    // ========== 练习计划子表 ==========
    std::vector<PracticePlan> practice_plans;   // 对应 report_practice_plans
};

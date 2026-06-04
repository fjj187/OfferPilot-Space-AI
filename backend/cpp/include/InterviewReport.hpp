#pragma once
#include <iostream>
#include <string>
#include <vector>
#include "../third_part/json.hpp"

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



// InterviewReport.hpp 底部

namespace nlohmann {
    inline void from_json(const nlohmann::json& j, PracticePlan& plan) {
        if (j.contains("weakness_tag")) j.at("weakness_tag").get_to(plan.weakness_tag);
        if (j.contains("question_type")) j.at("question_type").get_to(plan.question_type);
        if (j.contains("difficulty")) j.at("difficulty").get_to(plan.difficulty);
        if (j.contains("zone")) j.at("zone").get_to(plan.zone);
    }

    inline void from_json(const nlohmann::json& j, InterviewReport& report) {
        if (j.contains("id")) j.at("id").get_to(report.id);
        if (j.contains("session_id")) j.at("session_id").get_to(report.session_id);
        if (j.contains("user_id")) j.at("user_id").get_to(report.user_id);
        if (j.contains("topic")) j.at("topic").get_to(report.topic);
        if (j.contains("source")) j.at("source").get_to(report.source);
        if (j.contains("source_document_id")) j.at("source_document_id").get_to(report.source_document_id);
        if (j.contains("source_document_name")) j.at("source_document_name").get_to(report.source_document_name);
        if (j.contains("question_title")) j.at("question_title").get_to(report.question_title);
        if (j.contains("summary_headline")) j.at("summary_headline").get_to(report.summary_headline);
        if (j.contains("summary_body")) j.at("summary_body").get_to(report.summary_body);
        if (j.contains("primary_weakness")) j.at("primary_weakness").get_to(report.primary_weakness);
        if (j.contains("answered_count")) j.at("answered_count").get_to(report.answered_count);
        if (j.contains("total_count")) j.at("total_count").get_to(report.total_count);
        if (j.contains("created_at")) j.at("created_at").get_to(report.created_at);
        if (j.contains("updated_at")) j.at("updated_at").get_to(report.updated_at);
        if (j.contains("weakness_tags")) j.at("weakness_tags").get_to(report.weakness_tags);
        if (j.contains("answer_snapshots")) j.at("answer_snapshots").get_to(report.answer_snapshots);
        if (j.contains("suggested_focus")) j.at("suggested_focus").get_to(report.suggested_focus);
        if (j.contains("practice_plans")) j.at("practice_plans").get_to(report.practice_plans);
    }
}
#include "../include/ReportCommandHandler.hpp"
#include "../third_part/json.hpp"
#include <string>
ReportCommandHandler::ReportCommandHandler(ReportRepository& repository):m_repository(repository)
{
}


ReportCommandHandler::~ReportCommandHandler()
{
}

InterviewReport ReportCommandHandler::parseReportFromJson(const std::string& jsonPayload)
{
    nlohmann::json j = nlohmann::json::parse(jsonPayload);//·
    InterviewReport report;//报告对象,用于存储 JSON 字符串中的报告数据
    report.id=j["id"].get<std::string>();
    report.session_id=j["session_id"].get<std::string>();
    report.user_id=j["user_id"].get<int>();
    report.topic=j["topic"].get<std::string>();
    report.source=j["source"].get<std::string>();
    report.source_document_id=j["source_document_id"].get<std::string>();
    report.source_document_name=j["source_document_name"].get<std::string>();
    report.question_title=j["question_title"].get<std::string>();
    report.summary_headline=j["summary_headline"].get<std::string>();
    report.summary_body=j["summary_body"].get<std::string>();
    report.primary_weakness=j["primary_weakness"].get<std::string>();
    report.answered_count=j["answered_count"].get<int>();
    report.total_count=j["total_count"].get<int>();
    report.created_at=j["created_at"].get<std::string>();
    report.updated_at=j["updated_at"].get<std::string>();
    report.weakness_tags=j["weakness_tags"].get<std::vector<std::string>>();
    report.answer_snapshots=j["answer_snapshots"].get<std::vector<std::string>>();
    report.suggested_focus=j["suggested_focus"].get<std::vector<std::string>>();
    for (const auto& plan_json : j.at("practice_plans")) {
        PracticePlan plan;
        plan.weakness_tag  = plan_json.at("weakness_tag").get<std::string>();
        plan.question_type = plan_json.at("question_type").get<std::string>();
        plan.difficulty    = plan_json.at("difficulty").get<std::string>();
        plan.zone          = plan_json.at("zone").get<std::string>();
        report.practice_plans.push_back(std::move(plan));
    }
    return report;
}

std::string ReportCommandHandler::reportToJson(const InterviewReport& report)
{
    nlohmann::json j;
    j["id"]=report.id;
    j["session_id"]=report.session_id;
    j["user_id"]=report.user_id;
    j["topic"]=report.topic;
    j["source"]=report.source;
    j["source_document_id"]=report.source_document_id;
    j["source_document_name"]=report.source_document_name;
    j["question_title"]=report.question_title;
    j["summary_headline"]=report.summary_headline;
    j["summary_body"]=report.summary_body;
    j["primary_weakness"]=report.primary_weakness;
    j["answered_count"]=report.answered_count;
    j["total_count"]=report.total_count;
    j["created_at"]=report.created_at;
    j["updated_at"]=report.updated_at;
    j["weakness_tags"]=report.weakness_tags;
    j["answer_snapshots"]=report.answer_snapshots;
    j["suggested_focus"]=report.suggested_focus;
   j["practice_plans"] = nlohmann::json::array();

    for (const auto& plan : report.practice_plans) {
        nlohmann::json plan_json;
        plan_json["weakness_tag"]  = plan.weakness_tag;
        plan_json["question_type"] = plan.question_type;
        plan_json["difficulty"]    = plan.difficulty;
        plan_json["zone"]          = plan.zone;
        j["practice_plans"].push_back(plan_json);
    }
    return j.dump();
}

std::string ReportCommandHandler::reportsToJson(const std::vector<InterviewReport>& reports)
{
    nlohmann::json j;
    for (const auto& report : reports) {
        j.push_back(reportToJson(report));
    }
    return j.dump();
}

std::string ReportCommandHandler::successResponse(const std::string& data)
{
    nlohmann::json j;
    j["success"]=true;
    nlohmann::json data_json;
    data_json=nlohmann::json::parse(data);//将 JSON 字符串转换为 JSON 对象
    j["data"]=data_json;//将 JSON 对象赋值给 JSON 字符串中的 data 字段
    return j.dump();
}

std::string ReportCommandHandler::errorResponse(const std::string& message)
{
    nlohmann::json j;
    j["success"]=false;
    j["message"]=message;
    return j.dump();
}

std::string ReportCommandHandler::handleInsert(const std::string& jsonPayload)
{
    InterviewReport report=parseReportFromJson(jsonPayload);
    if(report.id==""||report.session_id==""){
        std::cout << "报告 ID 或会话 ID 为空" << std::endl;
        return errorResponse("报告 ID 或会话 ID 为空");
    }
    bool success=m_repository.insertReport(report);
    nlohmann::json data;
    data["session_id"]=report.session_id;
    data["report"]=reportToJson(report);
    if(success){
        return successResponse(data.dump());
    }
    else{
        return errorResponse("插入报告失败");
    }
}

std::string ReportCommandHandler::handleUpdate(const std::string& jsonPayload)
{
    InterviewReport report=parseReportFromJson(jsonPayload);
    if(report.id==""||report.session_id==""){
        std::cout << "报告 ID 或会话 ID 为空" << std::endl;
        return errorResponse("报告 ID 或会话 ID 为空");
    }
    bool success=m_repository.updateReport(report);
    nlohmann::json data;
    data["session_id"]=report.session_id;
    data["report"]=reportToJson(report);
    if(success){
        return successResponse(data.dump());
    }
    else{
        return errorResponse("更新报告失败");
    }
}

std::string ReportCommandHandler::handleGet(const std::string& jsonPayload){
    nlohmann::json j=nlohmann::json::parse(jsonPayload);//将 JSON 字符串转换为 JSON 对象
    std::string sessionId=j["session_id"].get<std::string>();
    if(sessionId==""){
        std::cout << "会话 ID 为空" << std::endl;
        return errorResponse("会话 ID 为空");
    }
    std::vector<InterviewReport> reports=m_repository.getReportBySessionId(sessionId);
    if(reports.empty()){
        std::cout << "数据库查询结果为空" << std::endl;
        return errorResponse("数据库查询结果为空");
    }
    InterviewReport report=reports[0];//获取对应会话ID的报告
    std::string data=reportToJson(report);
    return successResponse(data);
}

std::string ReportCommandHandler::handleList(const std::string& jsonPayload)
{
    nlohmann::json j=nlohmann::json::parse(jsonPayload);//将 JSON 字符串转换为 JSON 对象
    int userId=j["user_id"].get<int>();
    std::vector<InterviewReport> reports=m_repository.listReports(userId);
    if(reports.empty()){
        std::cout << "数据库查询结果为空" << std::endl;
        nlohmann::json data;
        data["message"] = "数据库查询结果为空";
        return successResponse(data.dump());
    }
    nlohmann::json data;
    data["reports"]=reportsToJson(reports);
    return successResponse(data.dump());
}

std::string ReportCommandHandler::handleDelete(const std::string& jsonPayload)
{
    nlohmann::json j=nlohmann::json::parse(jsonPayload);//将 JSON 字符串转换为 JSON 对象
    std::string sessionId=j["session_id"].get<std::string>();
    if(sessionId==""){
        std::cout << "会话 ID 为空" << std::endl;
        return errorResponse("会话 ID 为空");
    }
    bool success=m_repository.deleteReport(sessionId);
    if(success){
        nlohmann::json data;
        data["message"] = "删除报告成功";
        return successResponse(data.dump());
    }
    else{
        return errorResponse("删除报告失败");
    }
}




#include "services/ReportService.hpp"

ReportService::ReportService(JsonSessionRepository& sessionRepo,
                  IReportRepository& reportRepo,
                  IReportAiClient& aiClient)
                  :m_sessionRepo(sessionRepo),
                  m_reportRepo(reportRepo),
                  m_aiClient(aiClient)
{}

GenerateReportResult ReportService::generateReport(const GenerateReportRequest& request) {
    // 1. 校验 sessionId
    if (request.sessionId.empty()) {
        throw std::runtime_error("sessionId is required");
    }

    // 2. 先查 session
    auto sessions = m_sessionRepo.listSessionsBySessionId(request.sessionId);
    if (sessions.empty()) {
        throw std::runtime_error("Session not found");
    }

    // 3. 取最新一条作为报告上下文
    const auto& session = sessions.back();

    // 4. 判断是否已有报告
    auto existing = m_reportRepo.getReportBySessionId(request.sessionId);

    // 5. 先拼 prompt
    const auto systemPrompt = m_promptBuilder.buildSystemPrompt();
    const auto userPrompt = m_promptBuilder.buildUserPrompt(session, request);

    // 6. 调 AI
    std::string rawJson;
    bool aiSucceeded = true;
    std::string parseError;
    try {
        rawJson = m_aiClient.generateJson(systemPrompt, userPrompt);
    } catch (const std::exception&) {
        aiSucceeded = false;
    }

    // 7. 解析 AI 结果，失败则 fallback
    InterviewReportEntity report;
    if (aiSucceeded) {
        auto parsed = parseAiResultToEntity(rawJson, session, request, parseError);
        if (parsed.has_value()) {
            report = std::move(*parsed);
        } else {
            report = buildFallbackReport(session, request);
        }
    } else {
        report = buildFallbackReport(session, request);
    }

    // 8. 如果已有报告，保留原 id / createdAt
    if (existing.has_value()) {
        report.id = existing->id;
        report.createdAt = existing->createdAt;
    }

    // 9. 保存更新时间
    report.updatedAt = report.createdAt.empty() ? report.updatedAt : report.updatedAt;

    // 10. 落库
    m_reportRepo.upsertReport(report);

    GenerateReportResult result;
    result.report = std::move(report);
    result.created = !existing.has_value();
    return result;
}

std::optional<InterviewReportEntity> ReportService::parseAiResultToEntity(
    const std::string& rawJson,
    const InterviewSessionDetail& session,
    const GenerateReportRequest& request,
    std::string& errorMessage)
{
    try {
        auto j = nlohmann::json::parse(rawJson);

        InterviewReportEntity report;
        report.id = "report-" + session.sessionId;
        report.sessionId = session.sessionId;
        report.threadId = session.threadId;
        report.topic = request.topic.value_or(session.topic);
        report.source = request.source.value_or("mock-interview-space");
        report.sourceDocumentId = request.sourceDocumentId;
        report.sourceDocumentName = request.sourceDocumentName;
        report.questionTitle = session.questionTitle;

        report.summaryHeadline = j.value("summaryHeadline", "");
        report.summaryBody = j.value("summaryBody", "");
        report.weaknessTags = j.value("weaknessTags", std::vector<std::string>{});
        if (j.contains("primaryWeakness") && j["primaryWeakness"].is_string()) {
            report.primaryWeakness = j["primaryWeakness"].get<std::string>();
        }

        if (j.contains("answeredCount") && j["answeredCount"].is_number_integer()) {
            report.answeredCount = j["answeredCount"].get<int>();
        } else {
            report.answeredCount = request.answeredCount.value_or(0);
        }

        if (j.contains("totalCount") && j["totalCount"].is_number_integer()) {
            report.totalCount = j["totalCount"].get<int>();
        } else {
            report.totalCount = request.totalCount.value_or(0);
        }

        if (j.contains("suggestedFocus") && j["suggestedFocus"].is_array()) {
            report.suggestedFocus = j["suggestedFocus"].get<std::vector<std::string>>();
        }

        if (j.contains("practicePlan") && j["practicePlan"].is_object()) {
            PracticePlanSnapshot plan;
            const auto& p = j["practicePlan"];
            plan.weaknessTag = p.value("weaknessTag", report.primaryWeakness.value_or("当前弱项"));
            plan.questionType = p.value("questionType", "concept");
            plan.difficulty = p.value("difficulty", "medium");
            plan.zone = p.value("zone", "vue");
            report.practicePlan = plan;
        }

        report.summaryHeadline = report.summaryHeadline.empty()
            ? "阶段性复盘总结"
            : report.summaryHeadline;

        return report;
    } catch (const std::exception& e) {
        errorMessage = e.what();
        return std::nullopt;
    }
}

InterviewReportEntity ReportService::buildFallbackReport(
    const InterviewSessionDetail& session,
    const GenerateReportRequest& request) const
{
    InterviewReportEntity report;
    report.id = "report-" + session.sessionId;
    report.sessionId = session.sessionId;
    report.threadId = session.threadId;
    report.topic = request.topic.value_or(session.topic);
    report.source = request.source.value_or("mock-interview-space");
    report.sourceDocumentId = request.sourceDocumentId;
    report.sourceDocumentName = request.sourceDocumentName;
    report.questionTitle = session.questionTitle;

    report.answeredCount = request.answeredCount.value_or(session.messageCount / 2);
    report.totalCount = request.totalCount.value_or(session.messageCount);
    report.weaknessTags = request.weaknessTags.value_or(std::vector<std::string>{});
    if (request.primaryWeakness.has_value()) {
        report.primaryWeakness = request.primaryWeakness;
    } else if (!report.weaknessTags.empty()) {
        report.primaryWeakness = report.weaknessTags.front();
    }

    report.summaryHeadline = "本轮训练已完成基础复盘";
    report.summaryBody = request.summaryBody.value_or("本轮对话已沉淀为结构化报告，建议继续针对弱项训练。");

    if (request.suggestedFocus.has_value()) {
        report.suggestedFocus = request.suggestedFocus;
    }

    if (request.weaknessFocusAreas.has_value()) {
        report.weaknessFocusAreas = request.weaknessFocusAreas;
    }

    if (request.sourceDocumentExcerpt.has_value()) {
        report.answerSnapshot = std::vector<std::string>{ *request.sourceDocumentExcerpt };
    }

    report.practicePlan = PracticePlanSnapshot{
        report.primaryWeakness.value_or("当前弱项"),
        "concept",
        "medium",
        "vue"
    };

    return report;
}

std::vector<InterviewReportSummary> ReportService::listReports() {
    return m_reportRepo.listReports();
}

std::optional<InterviewReportEntity> ReportService::getReportBySessionId(const std::string& sessionId) {
    if (sessionId.empty()) {
        return std::nullopt;
    }
    return m_reportRepo.getReportBySessionId(sessionId);
}

void ReportService::clearAllReports() {
    m_reportRepo.clearAll();
}
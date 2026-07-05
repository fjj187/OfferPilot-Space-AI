#include "services/ReportService.hpp"

#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>

namespace {
std::string currentTimestampUtc() {
    const auto now = std::chrono::system_clock::now();
    const auto tt = std::chrono::system_clock::to_time_t(now);
    std::tm tm{};
#ifdef _WIN32
    gmtime_s(&tm, &tt);
#else
    gmtime_r(&tt, &tm);
#endif

    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

void applyRequestMetadata(InterviewReportEntity& report, const GenerateReportRequest& request) {
    report.modelId = request.modelId;
    report.sourceDocumentExcerpt = request.sourceDocumentExcerpt;
    report.questionReviews = request.questionReviews;
}
}

ReportService::ReportService(ISessionRepository& sessionRepo,
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
    std::string fallbackReason;
    try {
        rawJson = m_aiClient.generateJson(systemPrompt, userPrompt);
    } catch (const std::exception& e) {
        aiSucceeded = false;
        fallbackReason = e.what();
        std::cerr << "[ReportService] AI report generation failed: " << fallbackReason << std::endl;
    }

    // 7. 解析 AI 结果，失败则 fallback
    InterviewReportEntity report;
    if (aiSucceeded) {
        auto parsed = parseAiResultToEntity(rawJson, session, request, parseError);
        if (parsed.has_value()) {
            report = std::move(*parsed);
        } else {
            aiSucceeded = false;
            fallbackReason = "Model output is not valid report JSON: " + parseError;
            std::cerr << "[ReportService] AI report parse failed: " << fallbackReason << std::endl;
            report = buildFallbackReport(session, request);
        }
    } else {
        report = buildFallbackReport(session, request);
    }
    applyRequestMetadata(report, request);

    // 8. 如果已有报告，保留原 id / createdAt
    const auto now = currentTimestampUtc();
    if (existing.has_value()) {
        report.id = existing->id;
        report.createdAt = existing->createdAt;
        report.updatedAt = now;
    } else {
        report.createdAt = now;
        report.updatedAt = now;
    }

    // 9. 落库
    m_reportRepo.upsertReport(report);

    GenerateReportResult result;
    result.report = std::move(report);
    result.created = !existing.has_value();
    result.aiUsed = aiSucceeded;
    if (!aiSucceeded && !fallbackReason.empty()) {
        result.fallbackReason = fallbackReason;
    }
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
        report.modelId = request.modelId;
        report.sourceDocumentExcerpt = request.sourceDocumentExcerpt;
        report.questionReviews = request.questionReviews;
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
    report.modelId = request.modelId;
    report.sourceDocumentExcerpt = request.sourceDocumentExcerpt;
    report.questionReviews = request.questionReviews;
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

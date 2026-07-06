#pragma once

#include "builder/ReportPromptBuilder.hpp"
#include "repositories/IReportRepository.hpp"
#include "repositories/ISessionRepository.hpp"
#include "Client/IReportAiClient.hpp"

// 报告服务层。
// 负责根据一次面试会话生成报告，并维护报告的查询和清理。
class ReportService {
public:
    ReportService(ISessionRepository& sessionRepo,
                  IReportRepository& reportRepo,
                  IReportAiClient& aiClient);

    // 生成或更新报告；内部优先尝试 AI，失败则走 fallback。
    GenerateReportResult generateReport(const GenerateReportRequest& request);

    // 报告列表、单个报告查询、清空。
    std::vector<InterviewReportSummary> listReports();
    std::optional<InterviewReportEntity> getReportBySessionId(const std::string& sessionId);
    void clearAllReports();

private:
    ISessionRepository& m_sessionRepo;
    IReportRepository& m_reportRepo;
    IReportAiClient& m_aiClient;
    ReportPromptBuilder m_promptBuilder;

    std::optional<InterviewReportEntity> parseAiResultToEntity(
        const std::string& rawJson,
        const InterviewSessionDetail& session,
        const GenerateReportRequest& request,
        std::string& errorMessage);

    InterviewReportEntity buildFallbackReport(
        const InterviewSessionDetail& session,
        const GenerateReportRequest& request) const;
};


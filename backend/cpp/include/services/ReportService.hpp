#pragma once
#include "builder/ReportPromptBuilder.hpp"
#include "repositories/IReportRepository.hpp"
#include "repositories/ISessionRepository.hpp"
#include "Client/IReportAiClient.hpp"


// 4) 报告服务：负责串起 session -> AI -> report -> repository
class ReportService {
public:
    ReportService(ISessionRepository& sessionRepo,
                  IReportRepository& reportRepo,
                  IReportAiClient& aiClient);

    GenerateReportResult generateReport(const GenerateReportRequest& request);
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

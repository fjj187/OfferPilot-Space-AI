#include "services/ReportService.hpp"

ReportService::ReportService(JsonSessionRepository& sessionRepo,
                  IReportRepository& reportRepo,
                  IReportAiClient& aiClient)
                  :m_sessionRepo(sessionRepo),
                    m_reportRepo(reportRepo),
                    m_aiClient(aiClient)
{
}

GenerateReportResult ReportService::generateReport(const GenerateReportRequest& request){

}

std::vector<InterviewReportSummary> ReportService::listReports(){

}

std::optional<InterviewReportEntity> ReportService::getReportBySessionId(const std::string& sessionId){

}

void ReportService::clearAllReports(){

}
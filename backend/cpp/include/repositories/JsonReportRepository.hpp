#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <filesystem>
#include <fstream>
#include <chrono>
#include <iomanip>
#include <sstream>
#include "json.hpp"

#include "repositories/IReportRepository.hpp"
// 2) 报告仓库：负责持久化报告
class JsonReportRepository : public IReportRepository {
public:
    explicit JsonReportRepository(const std::string& filePath);

    bool upsertReport(const InterviewReportEntity& report) override;
    std::optional<InterviewReportEntity> getReportBySessionId(const std::string& sessionId) override;
    std::vector<InterviewReportSummary> listReports() override;
    bool removeBySessionId(const std::string& sessionId) override;
    void clearAll() override;

private:
    std::string m_filePath;
    std::vector<InterviewReportEntity> m_reports;
    std::unordered_map<std::string, size_t> m_index;

    void loadFromFile();
    bool persistToFile();
    std::string nowIsoUtc() const;
    std::string buildKey(const std::string& sessionId) const;
};

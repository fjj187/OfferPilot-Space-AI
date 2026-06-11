#pragma once
#include <string>
#include <vector>
#include <optional>
#include "types/ReportTypes.hpp"   // InterviewReportEntity, InterviewReportSummary


class IReportRepository {
public:
    virtual ~IReportRepository() = default;

    // 插入或更新报告
    virtual bool upsertReport(const InterviewReportEntity& report) = 0;

    // 根据 sessionId 获取报告
    virtual std::optional<InterviewReportEntity> getReportBySessionId(
        const std::string& sessionId) = 0;

    // 获取所有报告摘要列表
    virtual std::vector<InterviewReportSummary> listReports() = 0;

    // 删除某个 sessionId 对应的报告
    virtual bool removeBySessionId(const std::string& sessionId) = 0;

    // 清空所有报告数据
    virtual void clearAll() = 0;
};


#pragma once
#include <optional>
#include <string>
#include <vector>
#include "repositories/IReportRepository.hpp"
#include "Pool/MySQLConnectionPool.hpp"
#include <sstream>
#include <iomanip>
#include <ctime>

#include "json.hpp"

class MySQLReportRepository : public IReportRepository {
public:
    // 报表仓储从连接池借连接，避免单连接并发争用。
    explicit MySQLReportRepository(MySQLConnectionPool& pool);

    bool upsertReport(const InterviewReportEntity& report) override;//实现IReportRepository接口中的upsertReport方法，用于插入或更新报告
    std::optional<InterviewReportEntity> getReportBySessionId(const std::string& sessionId) override;//实现IReportRepository接口中的getReportBySessionId方法，用于根据sessionId获取报告
    std::vector<InterviewReportSummary> listReports() override;//实现IReportRepository接口中的listReports方法，用于获取所有报告摘要列表
    bool removeBySessionId(const std::string& sessionId) override;//实现IReportRepository接口中的removeBySessionId方法，用于删除某个sessionId对应的报告
    void clearAll() override;//实现IReportRepository接口中的clearAll方法，用于清空所有报告数据

private:
    InterviewReportSummary toSummary(const InterviewReportEntity& report) const;//将InterviewReportEntity对象转换为InterviewReportSummary对象
    MySQLConnectionPool& m_pool;
};

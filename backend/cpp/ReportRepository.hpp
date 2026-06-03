#pragma once
#include <iostream>
#include <string>
#include <vector>
#include "InterviewReport.hpp"
#include "MySQLConn.hpp"

class ReportRepository {
public:
    ReportRepository(MySQLConn* conn);
    ~ReportRepository();

    bool insertReport(const InterviewReport& report);//插入报告主表
    bool updateReport(const InterviewReport& report);//更新报告主表
    std::vector<InterviewReport> getReportBySessionId(const std::string& sessionId);//根据会话ID获取报告
    std::vector<InterviewReport> listReports(int userId);//根据用户ID获取所有报告
    bool deleteReport(const std::string& sessionId);//根据会话ID删除报告    

    MySQLConn* m_conn;

    bool insertWeaknessTags(const std::string& reportId, const std::vector<std::string>& tags);//插入弱项标签子表数据
    bool insertAnswerSnapshots(const std::string& reportId, const std::vector<std::string>& snapshots);//插入答题快照子表数据
    bool insertSuggestedFocus(const std::string& reportId, const std::vector<std::string>& focusItems);//插入建议关注子表数据
    bool insertPracticePlans(const std::string& reportId, const std::vector<PracticePlan>& plans);//插入练习计划子表数据
    bool clearSubTables(const std::string& reportId);//清空报告子表数据 （弱项标签、答题快照、建议关注、练习计划）
};

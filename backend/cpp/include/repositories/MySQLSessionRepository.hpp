#pragma once
#include <optional>
#include <string>
#include <vector>
#include "repositories/ISessionRepository.hpp"
#include "MySQLConn.hpp"
#include <sstream>
#include <iomanip>
#include <ctime>
#include <unordered_map>

#include "json.hpp"

class MySQLSessionRepository : public ISessionRepository {
public:
    explicit MySQLSessionRepository(MySQLConn& conn);

    bool recordUserMessage(const InterviewStreamRequest& request) override;//实现ISessionRepository接口中的recordUserMessage方法，用于记录用户消息
    bool recordAssistantMessage(const InterviewStreamRequest& request,//实现ISessionRepository接口中的recordAssistantMessage方法，用于记录assistant消息
                                const std::string& assistantContent) override;
    std::vector<InterviewSessionSummary> listSessions() override;//实现ISessionRepository接口中的listSessions方法，用于返回所有会话摘要列表
    std::optional<InterviewSessionDetail> getSession(
        const std::string& sessionId,
        const std::string& threadId) override;//实现ISessionRepository接口中的getSession方法，用于获取指定会话详情（含消息列表）
    std::vector<InterviewSessionDetail> listSessionsBySessionId(
        const std::string& sessionId) override;//实现ISessionRepository接口中的listSessionsBySessionId方法，用于按sessionId列出所有关联的会话详情（同一个session可能有多个thread）
    void clearAll() override;//实现ISessionRepository接口中的clearAll方法，用于清空所有会话数据

private:
    std::string buildKey(const std::string& sessionId, const std::string& threadId) const;//构建会话唯一标识符
    InterviewSessionSummary toSummary(const InterviewSessionDetail& detail) const;//将InterviewSessionDetail对象转换为InterviewSessionSummary对象

private:
    MySQLConn& m_conn;
};
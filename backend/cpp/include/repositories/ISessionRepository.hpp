#pragma once
#include <string>
#include <vector>
#include <optional>
#include "types/InterviewTypes.hpp"      // InterviewStreamRequest, InterviewSessionSummary, InterviewSessionDetail


class ISessionRepository {
public:
    virtual ~ISessionRepository() = default;

    // 记录一条用户消息
    virtual void recordUserMessage(const InterviewStreamRequest& request) = 0;

    // 记录一条 assistant 消息（传入已聚合的完整内容）
    virtual void recordAssistantMessage(const InterviewStreamRequest& request,
                                        const std::string& assistantContent) = 0;

    // 返回所有会话摘要列表
    virtual std::vector<InterviewSessionSummary> listSessions() = 0;

    // 获取指定会话详情（含消息列表）
    virtual std::optional<InterviewSessionDetail> getSession(
        const std::string& sessionId,
        const std::string& threadId) = 0;

    // 按 sessionId 列出所有关联的会话详情（同一个 session 可能有多个 thread）
    virtual std::vector<InterviewSessionDetail> listSessionsBySessionId(
        const std::string& sessionId) = 0;

    // 清空所有会话数据
    virtual void clearAll() = 0;
};

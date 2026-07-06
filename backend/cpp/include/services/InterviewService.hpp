#pragma once

#include <functional>
#include <memory>
#include <string>

#include "providers/InterviewProvider.hpp"
#include "repositories/ISessionRepository.hpp"

// 面试服务层。
// 负责把前端请求、AI provider、会话仓储串起来，形成完整的流式面试链路。
class InterviewService {
public:
    InterviewService(InterviewProvider& provider, ISessionRepository& repository);

    // 核心入口：校验请求、先写用户消息、调用 provider 流式产出、再写 assistant 消息。
    void streamInterview(const InterviewStreamRequest& request,
                         std::function<void(const InterviewStreamEvent&)> callback,
                         std::shared_ptr<ProviderContext> context = nullptr);

    // 会话查询和清理。
    std::vector<InterviewSessionSummary> listSessions();
    std::optional<InterviewSessionDetail> getSession(const std::string& sessionId, const std::string& threadId);
    void clearHistory();

private:
    bool validateRequest(const InterviewStreamRequest& request, std::string& errorMessage);
    std::shared_ptr<ProviderContext> createProviderContext(const InterviewStreamRequest& request);
    bool recordUserMessage(const InterviewStreamRequest& request);
    bool recordAssistantMessage(const InterviewStreamRequest& request, const std::string& assistantContent);

    InterviewProvider& m_provider;
    ISessionRepository& m_sessionRepository;
};


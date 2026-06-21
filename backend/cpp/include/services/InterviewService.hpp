#pragma once

#include <functional>
#include <memory>
#include <string>

#include "providers/InterviewProvider.hpp"
#include "repositories/JsonSessionRepository.hpp"


class InterviewService {
public:
    InterviewService(InterviewProvider& provider, JsonSessionRepository& repository);
    void streamInterview(const InterviewStreamRequest& request, 
                         std::function<void(const InterviewStreamEvent&)> callback,
                         std::shared_ptr<ProviderContext> context = nullptr);
    std::vector<InterviewSessionSummary> listSessions();
    std::optional<InterviewSessionDetail> getSession(const std::string& sessionId, const std::string& threadId);
    void clearHistory();
private:
    bool validateRequest(const InterviewStreamRequest& request, std::string& errorMessage);
    std::shared_ptr<ProviderContext> createProviderContext(const InterviewStreamRequest& request);
    bool recordUserMessage(const InterviewStreamRequest& request);
    bool recordAssistantMessage(const InterviewStreamRequest& request, const std::string& assistantContent);
    InterviewProvider& m_provider;
    JsonSessionRepository& m_sessionRepository;
};

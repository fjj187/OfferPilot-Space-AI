#include "services/InterviewService.hpp"

#include <utility>

InterviewService::InterviewService(InterviewProvider &provider, JsonSessionRepository &repository):
    m_provider(provider),
    m_sessionRepository(repository) {}


void InterviewService::streamInterview(const InterviewStreamRequest& request, 
std::function<void(const InterviewStreamEvent&)> callback,std::shared_ptr<ProviderContext> context) {
    std::string errorMessage;
    if (!validateRequest(request, errorMessage)) {
        InterviewStreamEvent event;
        event.type = InterviewStreamEventType::Error;
        event.error = ApiError{ApiErrorCode::InvalidRequest, errorMessage};
        callback(event);
        return;
    }

    auto providerContext = context ? std::move(context) : createProviderContext(request);
    if (!recordUserMessage(request)) {
        InterviewStreamEvent event;
        event.type = InterviewStreamEventType::Error;
        event.error = ApiError{ApiErrorCode::StorageError, "Failed to record user message"};
        callback(event);
        return;
    }

    std::string assistantContent;
    bool providerFailed = false;
    bool streamFinished = false;

    m_provider.streamFeedback(
        request,
        [&](const InterviewStreamEvent& event) {
            if (event.type == InterviewStreamEventType::Chunk && event.content.has_value()) {
                assistantContent += event.content.value();
            } else if (event.type == InterviewStreamEventType::Error) {
                providerFailed = true;
            } else if (event.type == InterviewStreamEventType::Done) {
                streamFinished = true;
            }
            callback(event);
        },
        providerContext);

    if (!providerFailed && streamFinished) {
        if (!recordAssistantMessage(request, assistantContent)) {
            InterviewStreamEvent event;
            event.type = InterviewStreamEventType::Error;
            event.error = ApiError{ApiErrorCode::StorageError, "Failed to record assistant message"};
            callback(event);
        }
    }
}

bool InterviewService::validateRequest(const InterviewStreamRequest& request, std::string& errorMessage) {
    const auto requireField = [&](const std::string& value, const char* name) -> bool {
        if (!value.empty()) {
            return true;
        }
        errorMessage = std::string("Missing required field: ") + name;
        return false;
    };

    if (!requireField(request.sessionId, "sessionId")) return false;
    if (!requireField(request.messageId, "messageId")) return false;
    if (!requireField(request.threadId, "threadId")) return false;
    if (!requireField(request.topic, "topic")) return false;
    if (!requireField(request.topicLabel, "topicLabel")) return false;
    if (!requireField(request.prompt, "prompt")) return false;
    if (!requireField(request.questionTitle, "questionTitle")) return false;
    if (!requireField(request.questionPrompt, "questionPrompt")) return false;
    if (!requireField(request.answer, "answer")) return false;
    return true;
}

std::shared_ptr<ProviderContext> InterviewService::createProviderContext(const InterviewStreamRequest& request) {
    auto context = std::make_shared<ProviderContext>();
    context->requestId = request.sessionId + ":" + request.messageId;
    context->timeoutMs = 30000;
    context->cancelFlag = false;
    context->providerName = "InterviewProvider";
    return context;
}

bool InterviewService::recordUserMessage(const InterviewStreamRequest& request) {
    return m_sessionRepository.recordUserMessage(request);
}

bool InterviewService::recordAssistantMessage(const InterviewStreamRequest& request, const std::string& assistantContent) {
    return m_sessionRepository.recordAssistantMessage(request, assistantContent);
}

std::vector<InterviewSessionSummary> InterviewService::listSessions() {
    return m_sessionRepository.listSessions();
}

std::optional<InterviewSessionDetail> InterviewService::getSession(const std::string& sessionId, const std::string& threadId) {
    return m_sessionRepository.getSession(sessionId, threadId);
}

void InterviewService::clearHistory() {
    m_sessionRepository.clearAll();
}

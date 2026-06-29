#pragma once
#include <memory>
#include <string>

#include "json.hpp"
#include "InterviewProvider.hpp"
#include "httplib.h"

class OpenAIInterviewProvider : public InterviewProvider {
public:
    OpenAIInterviewProvider(std::string apiKey,
                            std::string baseUrl,
                            std::string model,
                            int timeoutMs = 30000);

    void streamFeedback(const InterviewStreamRequest& request,
                        std::function<void(const InterviewStreamEvent&)> callback,
                        std::shared_ptr<ProviderContext> context = nullptr) override;

private:
    struct ParsedUrl {
        std::string scheme;
        std::string host;
        int port = 0;
        std::string basePath;
    };

    std::string buildSystemPrompt(const InterviewStreamRequest& request) const;
    nlohmann::json buildRequestBody(const InterviewStreamRequest& request) const;
    ParsedUrl parseBaseUrl() const;
    std::unique_ptr<httplib::Client> createClient() const;
    std::string buildRequestPath() const;
    static std::string stripCodeFence(const std::string& text);
    static std::string extractJsonObjectText(const std::string& text);
    static std::string trim(const std::string& text);
    static std::string joinPath(const std::string& left, const std::string& right);

    std::string m_apiKey;
    std::string m_baseUrl;
    std::string m_model;
    int m_timeoutMs;
    ParsedUrl m_parsedUrl;
};

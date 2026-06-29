#pragma once
#include "IReportAiClient.hpp"
#include<string>
#include<iostream>
#include "json.hpp"
#include "httplib.h"

class OpenAIReportAiClient : public IReportAiClient {
public:
    OpenAIReportAiClient(std::string apiKey,
                         std::string baseUrl,
                         std::string model,
                         int timeoutMs = 30000);

    std::string generateJson(const std::string& systemPrompt,
                             const std::string& userPrompt) override;

private:
    nlohmann::json buildChatCompletionBody(const std::string& systemPrompt,
                                           const std::string& userPrompt) const;

    std::string extractChatCompletionContent(const nlohmann::json& response) const;
    static std::string stripCodeFence(const std::string& text);
    static std::string extractJsonObjectText(const std::string& text);

    std::string m_apiKey;
    std::string m_baseUrl;
    std::string m_model;
    int m_timeoutMs;
};
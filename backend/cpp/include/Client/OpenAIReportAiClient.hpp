#pragma once
#include "IReportAiClient.hpp"
#include<string>
#include<iostream>
#include "json.hpp"

class OpenAIReportAiClient : public IReportAiClient {
public:
    OpenAIReportAiClient(std::string apiKey,
                         std::string baseUrl,
                         std::string model);

    std::string generateJson(const std::string& systemPrompt,
                             const std::string& userPrompt) override;

private:
    std::string m_apiKey;
    std::string m_baseUrl;
    std::string m_model;
    int m_timeoutMs;
};
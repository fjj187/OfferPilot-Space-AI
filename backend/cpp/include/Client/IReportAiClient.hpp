#pragma once

#include <string>

// 1) AI 客户端：负责和模型通信
class IReportAiClient {
public:
    virtual ~IReportAiClient() = default;
    virtual std::string generateJson(const std::string& systemPrompt,
                                     const std::string& userPrompt) = 0;
};

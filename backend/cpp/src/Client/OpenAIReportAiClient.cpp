#include "Client/OpenAIReportAiClient.hpp"

OpenAIReportAiClient::OpenAIReportAiClient(std::string apiKey,
                         std::string baseUrl,
                         std::string model)
                         :m_apiKey(apiKey),
                          m_baseUrl(baseUrl),
                          m_model(model)
{
}

std::string OpenAIReportAiClient::generateJson(const std::string& systemPrompt,
                             const std::string& userPrompt){
                                try{
                                    nlohmann::json result;
                                    result["system"] = systemPrompt;   // 作为 JSON 字符串存储
                                    result["user"]   = userPrompt;
                                    return result.dump(2);
                                }catch(const std::exception& e){
                                    std::cerr << "Error generating JSON: " << e.what() << std::endl;
                                    return "{}";  // 返回一个空对象或 rethrow
                                }
                             }
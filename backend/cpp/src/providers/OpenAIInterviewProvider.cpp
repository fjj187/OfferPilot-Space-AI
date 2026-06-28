#include "providers/OpenAIInterviewProvider.hpp"

std::string OpenAIInterviewProvider::buildSystemPrompt(const InterviewStreamRequest& request) const {
    return R"(
你是一名面试陪练助手。
你的任务是根据用户回答进行追问、纠错和提示。
输出要求：
1. 只输出自然语言内容，不要输出 JSON。
2. 简洁、直接、专业。
3. 不要一次性把标准答案全抛出来，优先引导用户思考。
4. 如果用户回答明显错误，先指出问题，再给提示。
)";
}

nlohmann::json OpenAIInterviewProvider::buildRequestBody(const InterviewStreamRequest& request) const {
    nlohmann::json body;
    body["model"] = m_model;
    body["stream"] = true;

    body["messages"] = nlohmann::json::array();

    body["messages"].push_back({
        {"role", "system"},
        {"content", buildSystemPrompt(request)}
    });

    std::string userContent;
    userContent += "题目：" + request.questionTitle + "\n";
    userContent += "题目内容：" + request.questionPrompt + "\n";
    userContent += "用户回答：" + request.answer + "\n";

    if (request.sourceContext.has_value()) {
        userContent += "上下文：" + *request.sourceContext + "\n";
    }

    body["messages"].push_back({
        {"role", "user"},
        {"content", userContent}
    });

    return body;
}

void OpenAIInterviewProvider::streamFeedback(
    const InterviewStreamRequest& request,
    std::function<void(const InterviewStreamEvent&)> callback,
    std::shared_ptr<ProviderContext> context) 
{
    try {
        if (context && context->cancelFlag) {
            InterviewStreamEvent event;
            event.type = InterviewStreamEventType::Error;
            event.error = ApiError{ApiErrorCode::ProviderError, "Request cancelled"};
            callback(event);
            return;
        }

        // 1. 组请求体
        nlohmann::json body = buildRequestBody(request);
        std::string bodyStr = body.dump();

        // 2. 组请求头
        httplib::Headers headers = {
            {"Authorization", "Bearer " + m_apiKey},
            {"Content-Type", "application/json"},
            {"Accept", "text/event-stream"}
        };

        // 3. 选 client
        std::unique_ptr<httplib::Client> client;
        // 如果你 baseUrl 是 https://...，这里通常要用 SSLClient
        client = std::make_unique<httplib::Client>(m_baseUrl);
        client->set_connection_timeout(m_timeoutMs / 1000, 0);
        client->set_read_timeout(m_timeoutMs / 1000, 0);
        client->set_write_timeout(m_timeoutMs / 1000, 0);

        std::string buffer;

        // 4. 发流式请求
        auto res = client->Post(
            "/v1/chat/completions",
            headers,
            bodyStr,
            "application/json",
            [&](const char* data, size_t data_length) {
                buffer.append(data, data_length);

                size_t pos = 0;
                while (true) {
                    size_t lineEnd = buffer.find('\n', pos);
                    if (lineEnd == std::string::npos) break;

                    std::string line = buffer.substr(pos, lineEnd - pos);
                    pos = lineEnd + 1;

                    if (!line.empty() && line.back() == '\r') {
                        line.pop_back();
                    }

                    // 只处理 SSE data 行
                    if (line.rfind("data: ", 0) == 0) {
                        std::string payload = line.substr(6);

                        if (payload == "[DONE]") {
                            InterviewStreamEvent doneEvent;
                            doneEvent.type = InterviewStreamEventType::Done;
                            callback(doneEvent);
                            return false;
                        }

                        try {
                            auto j = nlohmann::json::parse(payload);

                            // 按 chat completions streaming 的常见格式取内容
                            if (j.contains("choices") && j["choices"].is_array() && !j["choices"].empty()) {
                                const auto& choice = j["choices"][0];
                                if (choice.contains("delta") && choice["delta"].contains("content")) {
                                    std::string chunkText = choice["delta"]["content"].get<std::string>();

                                    InterviewStreamEvent chunkEvent;
                                    chunkEvent.type = InterviewStreamEventType::Chunk;
                                    chunkEvent.content = chunkText;
                                    callback(chunkEvent);
                                }
                            }
                        } catch (...) {
                            // 某些行可能不是完整 JSON，先忽略
                        }
                    }
                }

                buffer.erase(0, pos);
                return true;
            }
        );

        if (!res) {
            InterviewStreamEvent event;
            event.type = InterviewStreamEventType::Error;
            event.error = ApiError{ApiErrorCode::ProviderError, "HTTP request failed"};
            callback(event);
            return;
        }

        if (res->status >= 400) {
            InterviewStreamEvent event;
            event.type = InterviewStreamEventType::Error;
            event.error = ApiError{ApiErrorCode::ProviderError, "OpenAI returned HTTP " + std::to_string(res->status)};
            callback(event);
            return;
        }

    } catch (const std::exception& e) {
        InterviewStreamEvent event;
        event.type = InterviewStreamEventType::Error;
        event.error = ApiError{ApiErrorCode::ProviderError, e.what()};
        callback(event);
    }
}
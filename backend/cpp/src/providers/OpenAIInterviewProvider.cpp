#include "providers/OpenAIInterviewProvider.hpp"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <stdexcept>

namespace {
bool isHttpsScheme(const std::string& scheme) {
    return scheme == "https";
}
}

OpenAIInterviewProvider::OpenAIInterviewProvider(std::string apiKey,
                                                 std::string baseUrl,
                                                 std::string model,
                                                 int timeoutMs)
    : m_apiKey(std::move(apiKey)),
      m_baseUrl(std::move(baseUrl)),
      m_model(std::move(model)),
      m_timeoutMs(timeoutMs),
      m_parsedUrl(parseBaseUrl()) {}

std::string OpenAIInterviewProvider::trim(const std::string& text) {
    const auto first = text.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) {
        return {};
    }
    const auto last = text.find_last_not_of(" \t\r\n");
    return text.substr(first, last - first + 1);
}

std::string OpenAIInterviewProvider::joinPath(const std::string& left, const std::string& right) {
    if (left.empty()) {
        return right;
    }
    if (right.empty()) {
        return left;
    }
    if (left.back() == '/' && right.front() == '/') {
        return left + right.substr(1);
    }
    if (left.back() != '/' && right.front() != '/') {
        return left + "/" + right;
    }
    return left + right;
}

OpenAIInterviewProvider::ParsedUrl OpenAIInterviewProvider::parseBaseUrl() const {
    const std::string normalized = trim(m_baseUrl);
    if (normalized.empty()) {
        throw std::runtime_error("OpenAIInterviewProvider baseUrl is empty");
    }

    const auto schemeEnd = normalized.find("://");
    if (schemeEnd == std::string::npos) {
        throw std::runtime_error("baseUrl must include scheme, for example https://host/path");
    }

    ParsedUrl parsed;
    parsed.scheme = normalized.substr(0, schemeEnd);

    std::string rest = normalized.substr(schemeEnd + 3);
    const auto pathPos = rest.find('/');
    std::string authority = pathPos == std::string::npos ? rest : rest.substr(0, pathPos);
    parsed.basePath = pathPos == std::string::npos ? std::string() : rest.substr(pathPos);

    const auto colonPos = authority.rfind(':');
    if (colonPos != std::string::npos) {
        parsed.host = authority.substr(0, colonPos);
        parsed.port = std::stoi(authority.substr(colonPos + 1));
    } else {
        parsed.host = authority;
        parsed.port = isHttpsScheme(parsed.scheme) ? 443 : 80;
    }

    if (parsed.host.empty()) {
        throw std::runtime_error("baseUrl host is empty");
    }

    return parsed;
}

std::unique_ptr<httplib::Client> OpenAIInterviewProvider::createClient() const {
#ifndef CPPHTTPLIB_OPENSSL_SUPPORT
    if (isHttpsScheme(m_parsedUrl.scheme)) {
        throw std::runtime_error("HTTPS endpoint requires CPPHTTPLIB_OPENSSL_SUPPORT");
    }
#endif
    const std::string schemeHostPort = m_parsedUrl.scheme + "://" + m_parsedUrl.host + ":" + std::to_string(m_parsedUrl.port);
    return std::make_unique<httplib::Client>(schemeHostPort);
}

std::string OpenAIInterviewProvider::buildRequestPath() const {
    return joinPath(m_parsedUrl.basePath, "/chat/completions");
}

std::string OpenAIInterviewProvider::buildSystemPrompt(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    oss << "你是一名专业的模拟面试官。\n";
    oss << "你的任务是根据用户回答进行追问、纠错和引导。\n";
    oss << "输出要求：\n";
    oss << "1. 只输出自然语言内容，不要输出JSON。\n";
    oss << "2. 简洁、直接、专业。\n";
    oss << "3. 不要一次性把标准答案全部抛出来，优先引导用户思考。\n";
    oss << "4. 如果用户回答明显错误，先指出问题，再给提示。\n";
    if (!request.topicLabel.empty()) {
        oss << "5. 当前主题：" << request.topicLabel << "\n";
    }
    return oss.str();
}

nlohmann::json OpenAIInterviewProvider::buildRequestBody(const InterviewStreamRequest& request) const {
    nlohmann::json body;
    body["model"] = m_model;
    body["stream"] = true;
    body["temperature"] = 0.7;

    body["messages"] = nlohmann::json::array();
    body["messages"].push_back({
        {"role", "system"},
        {"content", buildSystemPrompt(request)}
    });

    std::ostringstream userContent;
    userContent << "题目：" << request.questionTitle << "\n";
    userContent << "题目内容：" << request.questionPrompt << "\n";
    userContent << "用户回答：" << request.answer << "\n";
    if (request.sourceContext.has_value() && !request.sourceContext->empty()) {
        userContent << "上下文：" << *request.sourceContext << "\n";
    }
    if (request.sourceDocumentExcerpt.has_value() && !request.sourceDocumentExcerpt->empty()) {
        userContent << "资料片段：" << *request.sourceDocumentExcerpt << "\n";
    }

    body["messages"].push_back({
        {"role", "user"},
        {"content", userContent.str()}
    });

    return body;
}

std::string OpenAIInterviewProvider::stripCodeFence(const std::string& text) {
    const std::string fence = "```";
    const auto start = text.find(fence);
    if (start == std::string::npos) {
        return text;
    }
    const auto firstLineEnd = text.find('\n', start);
    const auto lastFence = text.rfind(fence);
    if (firstLineEnd == std::string::npos || lastFence == std::string::npos || lastFence <= firstLineEnd) {
        return text;
    }
    return text.substr(firstLineEnd + 1, lastFence - firstLineEnd - 1);
}

std::string OpenAIInterviewProvider::extractJsonObjectText(const std::string& text) {
    const auto left = text.find('{');
    const auto right = text.rfind('}');
    if (left != std::string::npos && right != std::string::npos && right > left) {
        return text.substr(left, right - left + 1);
    }
    return text;
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

        if (m_apiKey.empty()) {
            throw std::runtime_error("OpenAIInterviewProvider apiKey is empty");
        }

        const auto body = buildRequestBody(request);
        auto client = createClient();

        const auto sec = m_timeoutMs / 1000;
        const auto usec = (m_timeoutMs % 1000) * 1000;
        client->set_connection_timeout(sec, usec);
        client->set_read_timeout(sec, usec);
        client->set_write_timeout(sec, usec);

        httplib::Headers headers = {
            {"Authorization", "Bearer " + m_apiKey},
            {"Content-Type", "application/json"},
            {"Accept", "text/event-stream"}
        };

        std::string buffer;
        auto res = client->Post(
            buildRequestPath(),
            headers,
            body.dump(),
            "application/json",
            [&](const char* data, size_t data_length) {
                buffer.append(data, data_length);

                size_t consumed = 0;
                while (true) {
                    const auto lineEnd = buffer.find('\n', consumed);
                    if (lineEnd == std::string::npos) {
                        break;
                    }

                    std::string line = buffer.substr(consumed, lineEnd - consumed);
                    consumed = lineEnd + 1;

                    if (!line.empty() && line.back() == '\r') {
                        line.pop_back();
                    }

                    if (line.rfind("data:", 0) != 0) {
                        continue;
                    }

                    std::string payload = trim(line.substr(5));
                    if (payload == "[DONE]") {
                        InterviewStreamEvent doneEvent;
                        doneEvent.type = InterviewStreamEventType::Done;
                        callback(doneEvent);
                        return false;
                    }

                    try {
                        const auto j = nlohmann::json::parse(payload);
                        if (j.contains("choices") && j["choices"].is_array() && !j["choices"].empty()) {
                            const auto& choice = j["choices"][0];
                            if (choice.contains("delta") && choice["delta"].contains("content")) {
                                InterviewStreamEvent chunkEvent;
                                chunkEvent.type = InterviewStreamEventType::Chunk;
                                chunkEvent.content = choice["delta"]["content"].get<std::string>();
                                callback(chunkEvent);
                            }
                        }
                    } catch (...) {
                    }
                }

                buffer.erase(0, consumed);
                return true;
            }
        );

        if (!res) {
            throw std::runtime_error("OpenAIInterviewProvider request failed");
        }
        if (res->status >= 400) {
            throw std::runtime_error("OpenAIInterviewProvider HTTP error: " + std::to_string(res->status) + " body=" + res->body);
        }
    } catch (const std::exception& e) {
        InterviewStreamEvent event;
        event.type = InterviewStreamEventType::Error;
        event.error = ApiError{ApiErrorCode::ProviderError, e.what()};
        callback(event);
    }
}

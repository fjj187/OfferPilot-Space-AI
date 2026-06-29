#include "Client/OpenAIReportAiClient.hpp"

#include <stdexcept>
#include <sstream>

namespace {
struct ParsedUrl {
    std::string scheme;
    std::string host;
    int port = 0;
    std::string basePath;
};

std::string trim(const std::string& text) {
    const auto first = text.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) {
        return {};
    }
    const auto last = text.find_last_not_of(" \t\r\n");
    return text.substr(first, last - first + 1);
}

ParsedUrl parseBaseUrl(const std::string& baseUrl) {
    const std::string normalized = trim(baseUrl);
    if (normalized.empty()) {
        throw std::runtime_error("OpenAIReportAiClient baseUrl is empty");
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
        parsed.port = parsed.scheme == "https" ? 443 : 80;
    }

    if (parsed.host.empty()) {
        throw std::runtime_error("baseUrl host is empty");
    }

    return parsed;
}

std::string joinPath(const std::string& left, const std::string& right) {
    if (left.empty()) return right;
    if (right.empty()) return left;
    if (left.back() == '/' && right.front() == '/') return left + right.substr(1);
    if (left.back() != '/' && right.front() != '/') return left + "/" + right;
    return left + right;
}
}

OpenAIReportAiClient::OpenAIReportAiClient(std::string apiKey,
                                           std::string baseUrl,
                                           std::string model,
                                           int timeoutMs)
    : m_apiKey(std::move(apiKey)),
      m_baseUrl(std::move(baseUrl)),
      m_model(std::move(model)),
      m_timeoutMs(timeoutMs) {}

nlohmann::json OpenAIReportAiClient::buildChatCompletionBody(
    const std::string& systemPrompt,
    const std::string& userPrompt) const
{
    nlohmann::json body;
    body["model"] = m_model;
    body["stream"] = false;
    body["temperature"] = 0;

    body["messages"] = nlohmann::json::array();
    body["messages"].push_back({
        {"role", "system"},
        {"content", systemPrompt}
    });
    body["messages"].push_back({
        {"role", "user"},
        {"content", userPrompt}
    });

    return body;
}

std::string OpenAIReportAiClient::extractChatCompletionContent(
    const nlohmann::json& response) const
{
    if (!response.contains("choices") || !response["choices"].is_array() || response["choices"].empty()) {
        return {};
    }

    const auto& choice = response["choices"][0];
    if (!choice.contains("message") || !choice["message"].is_object()) {
        return {};
    }

    const auto& message = choice["message"];
    if (!message.contains("content") || !message["content"].is_string()) {
        return {};
    }

    return message["content"].get<std::string>();
}

std::string OpenAIReportAiClient::stripCodeFence(const std::string& text) {
    const std::string fence = "```";
    const auto start = text.find(fence);
    if (start != std::string::npos) {
        const auto firstLineEnd = text.find('\n', start);
        const auto lastFence = text.rfind(fence);
        if (firstLineEnd != std::string::npos && lastFence != std::string::npos && lastFence > firstLineEnd) {
            return text.substr(firstLineEnd + 1, lastFence - firstLineEnd - 1);
        }
    }
    return text;
}

std::string OpenAIReportAiClient::extractJsonObjectText(const std::string& text) {
    const auto left = text.find('{');
    const auto right = text.rfind('}');
    if (left != std::string::npos && right != std::string::npos && right > left) {
        return text.substr(left, right - left + 1);
    }

    return text;
}

std::string OpenAIReportAiClient::generateJson(const std::string& systemPrompt,
                                               const std::string& userPrompt) {
    if (m_apiKey.empty()) {
        throw std::runtime_error("OpenAI API key is empty");
    }

    const auto body = buildChatCompletionBody(systemPrompt, userPrompt);
    const auto parsedUrl = parseBaseUrl(m_baseUrl);

    std::unique_ptr<httplib::Client> client;
#ifndef CPPHTTPLIB_OPENSSL_SUPPORT
    if (parsedUrl.scheme == "https") {
        throw std::runtime_error("HTTPS endpoint requires CPPHTTPLIB_OPENSSL_SUPPORT");
    }
#endif
    const std::string schemeHostPort = parsedUrl.scheme + "://" + parsedUrl.host + ":" + std::to_string(parsedUrl.port);
    client = std::make_unique<httplib::Client>(schemeHostPort);

    const auto sec = m_timeoutMs / 1000;
    const auto usec = (m_timeoutMs % 1000) * 1000;
    client->set_connection_timeout(sec, usec);
    client->set_read_timeout(sec, usec);
    client->set_write_timeout(sec, usec);

    httplib::Headers headers = {
        {"Authorization", "Bearer " + m_apiKey},
        {"Content-Type", "application/json"}
    };

    const auto path = joinPath(parsedUrl.basePath, "/chat/completions");
    auto res = client->Post(path, headers, body.dump(), "application/json");
    if (!res) {
        throw std::runtime_error("OpenAI request failed: no response");
    }
    if (res->status >= 400) {
        throw std::runtime_error("OpenAI HTTP error: " + std::to_string(res->status) + " body=" + res->body);
    }

    nlohmann::json resp;
    try {
        resp = nlohmann::json::parse(res->body);
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("OpenAI response is not valid JSON: ") + e.what());
    }

    const auto content = extractChatCompletionContent(resp);
    if (content.empty()) {
        throw std::runtime_error("OpenAI response has empty content");
    }

    const auto cleaned = extractJsonObjectText(stripCodeFence(content));

    nlohmann::json result;
    try {
        result = nlohmann::json::parse(cleaned);
    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("Model output is not valid JSON: ") + e.what() + "\nraw=" + cleaned);
    }

    return result.dump(2);
}

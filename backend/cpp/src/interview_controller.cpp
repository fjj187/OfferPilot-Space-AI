#include "interview_controller.hpp"

static std::optional<InterviewFeedbackStyle> parseFeedbackStyle(const std::string& s) {
    if (s == "followup") return InterviewFeedbackStyle::Followup;
    if (s == "corrective") return InterviewFeedbackStyle::Corrective;
    if (s == "guided") return InterviewFeedbackStyle::Guided;
    return std::nullopt;
}

static std::optional<InterviewMessageFormat> parseFormat(const std::string& s) {
    if (s == "plain") return InterviewMessageFormat::Plain;
    if (s == "markdown") return InterviewMessageFormat::Markdown;
    return std::nullopt;
}

static std::optional<std::string> feedbackStyleToString(const std::optional<InterviewFeedbackStyle>& style) {
    if (!style.has_value()) return std::nullopt;
    switch (*style) {
        case InterviewFeedbackStyle::Followup: return "followup";
        case InterviewFeedbackStyle::Corrective: return "corrective";
        case InterviewFeedbackStyle::Guided: return "guided";
    }
    return std::nullopt;
}

InterviewStreamRequest InterviewController::parseStreamRequest(const nlohmann::json& body) const {
    InterviewStreamRequest request;
    request.sessionId = body.value("sessionId", "");
    request.messageId = body.value("messageId", "");
    request.threadId = body.value("threadId", "");
    request.topic = body.value("topic", "");
    request.topicLabel = body.value("topicLabel", "");
    request.prompt = body.value("prompt", "");
    request.questionTitle = body.value("questionTitle", "");
    request.questionPrompt = body.value("questionPrompt", "");
    request.answer = body.value("answer", "");

    if (body.contains("sourceContext") && body["sourceContext"].is_string())
        request.sourceContext = body["sourceContext"].get<std::string>();
    if (body.contains("sourceDocumentName") && body["sourceDocumentName"].is_string())
        request.sourceDocumentName = body["sourceDocumentName"].get<std::string>();
    if (body.contains("sourceDocumentSummary") && body["sourceDocumentSummary"].is_string())
        request.sourceDocumentSummary = body["sourceDocumentSummary"].get<std::string>();
    if (body.contains("sourceDocumentTags") && body["sourceDocumentTags"].is_array()) {
        std::vector<std::string> tags;
        for (const auto& item : body["sourceDocumentTags"]) {
            if (item.is_string()) tags.push_back(item.get<std::string>());
        }
        request.sourceDocumentTags = std::move(tags);
    }
    if (body.contains("sourceDocumentExcerpt") && body["sourceDocumentExcerpt"].is_string())
        request.sourceDocumentExcerpt = body["sourceDocumentExcerpt"].get<std::string>();

    if (body.contains("options") && body["options"].is_object()) {
        const auto& options = body["options"];

        if (options.contains("feedbackStyle") && options["feedbackStyle"].is_string())
            request.options.feedbackStyle = parseFeedbackStyle(options["feedbackStyle"].get<std::string>());
        if (options.contains("format") && options["format"].is_string())
            request.options.format = parseFormat(options["format"].get<std::string>());
        if (options.contains("questionIndex") && options["questionIndex"].is_number_integer())
            request.options.questionIndex = options["questionIndex"].get<int>();
        if (options.contains("questionCount") && options["questionCount"].is_number_integer())
            request.options.questionCount = options["questionCount"].get<int>();
        if (options.contains("unknownAnswerStreak") && options["unknownAnswerStreak"].is_number_integer())
            request.options.unknownAnswerStreak = options["unknownAnswerStreak"].get<int>();
        if (options.contains("forceRevealReferenceAnswer") && options["forceRevealReferenceAnswer"].is_boolean())
            request.options.forceRevealReferenceAnswer = options["forceRevealReferenceAnswer"].get<bool>();
        if (options.contains("referenceAnswerHint") && options["referenceAnswerHint"].is_string())
            request.options.referenceAnswerHint = options["referenceAnswerHint"].get<std::string>();
    }

    return request;
}

std::string InterviewController::serializeSseEvent(const std::string& eventName, const std::string& data) {
    return "event: " + eventName + "\ndata: " + data + "\n\n";
}

void InterviewController::streamInterview(const httplib::Request& req, httplib::Response& res) {
    try {
        const auto body = nlohmann::json::parse(req.body);
        const auto request = parseStreamRequest(body);

        res.set_header("Content-Type", "text/event-stream; charset=utf-8");
        res.set_header("Cache-Control", "no-cache, no-transform");
        res.set_header("Connection", "keep-alive");

        res.set_chunked_content_provider("text/event-stream",
            [this, request](size_t, httplib::DataSink& sink) {
                m_service.streamInterview(
                    request,
                    [&](const InterviewStreamEvent& event) {
                        if (event.type == InterviewStreamEventType::Chunk && event.content.has_value()) {
                            const auto payload = serializeSseEvent("chunk", event.content.value());
                            sink.write(payload.c_str(), payload.size());
                        } else if (event.type == InterviewStreamEventType::Done) {
                            const auto payload = serializeSseEvent("done", "{}");
                            sink.write(payload.c_str(), payload.size());
                        } else if (event.type == InterviewStreamEventType::Error && event.error.has_value()) {
                            const auto payload = serializeSseEvent("error", event.error->message);
                            sink.write(payload.c_str(), payload.size());
                        }
                    });

                return false;
            });
    } catch (const std::exception& e) {
        res.status = 400;
        res.set_content(std::string("{\"success\":false,\"error\":\"") + e.what() + "\"}",
                        "application/json");
    }
}

void InterviewController::generateReport(const httplib::Request&, httplib::Response& res) {
    res.status = 501;
    res.set_content("{\"success\":false,\"error\":\"Not implemented\"}", "application/json");
}

void InterviewController::getReport(const httplib::Request&, httplib::Response& res) {
    res.status = 501;
    res.set_content("{\"success\":false,\"error\":\"Not implemented\"}", "application/json");
}

void InterviewController::listReports(const httplib::Request&, httplib::Response& res) {
    res.status = 501;
    res.set_content("{\"success\":false,\"error\":\"Not implemented\"}", "application/json");
}

void InterviewController::createSession(const httplib::Request&, httplib::Response& res) {
    res.status = 501;
    res.set_content("{\"success\":false,\"error\":\"Not implemented\"}", "application/json");
}

void InterviewController::sendMessage(const httplib::Request&, httplib::Response& res) {
    res.status = 501;
    res.set_content("{\"success\":false,\"error\":\"Not implemented\"}", "application/json");
}

void InterviewController::listSessions(const httplib::Request&, httplib::Response& res) {
    const auto sessions = m_service.listSessions();
    nlohmann::json j;
    j["sessions"] = nlohmann::json::array();

    for (const auto& s : sessions) {
        nlohmann::json item;
        item["sessionId"] = s.sessionId;
        item["threadId"] = s.threadId;
        item["topic"] = s.topic;
        item["questionTitle"] = s.questionTitle;
        item["feedbackStyle"] = feedbackStyleToString(s.feedbackStyle);
        item["messageCount"] = s.messageCount;
        item["latestUserMessage"] = s.latestUserMessage;
        item["latestAssistantMessage"] = s.latestAssistantMessage;
        item["createdAt"] = s.createdAt;
        item["updatedAt"] = s.updatedAt;
        j["sessions"].push_back(std::move(item));
    }

    res.set_content(j.dump(), "application/json");
}

void InterviewController::getSession(const httplib::Request& req, httplib::Response& res) {
    const auto sessionId = req.path_params.at("sessionId");
    const auto threadId = req.path_params.at("threadId");

    const auto detail = m_service.getSession(sessionId, threadId);
    if (!detail.has_value()) {
        res.status = 404;
        res.set_content(R"({"success":false,"error":"Session not found"})", "application/json");
        return;
    }

    nlohmann::json messages = nlohmann::json::array();
    for (const auto& msg : detail->messages) {
        messages.push_back({
            {"role", msg.role == InterviewMessageRole::User ? "user" : "assistant"},
            {"content", msg.content},
            {"createdAt", msg.createdAt}
        });
    }

    nlohmann::json session;
    session["sessionId"] = detail->sessionId;
    session["threadId"] = detail->threadId;
    session["topic"] = detail->topic;
    session["questionTitle"] = detail->questionTitle;
    session["feedbackStyle"] = feedbackStyleToString(detail->feedbackStyle);
    session["messageCount"] = detail->messageCount;
    session["latestUserMessage"] = detail->latestUserMessage;
    session["latestAssistantMessage"] = detail->latestAssistantMessage;
    session["createdAt"] = detail->createdAt;
    session["updatedAt"] = detail->updatedAt;
    session["messages"] = std::move(messages);

    nlohmann::json j;
    j["session"] = std::move(session);
    res.set_content(j.dump(), "application/json");
}

void InterviewController::clearHistory(const httplib::Request&, httplib::Response& res) {
    m_service.clearHistory();
    res.set_content(R"({"ok":true})", "application/json");
}

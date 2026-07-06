#include "repositories/MySQLSessionRepository.hpp"

namespace {
std::string escapeSql(MySQLConn& conn, const std::string& input) {
    std::string escaped;
    escaped.resize(input.size() * 2 + 1);

    const unsigned long len = mysql_real_escape_string(
        conn.raw(),
        escaped.data(),
        input.c_str(),
        static_cast<unsigned long>(input.size())
    );

    escaped.resize(len);
    return escaped;
}

std::optional<std::string> nullIfEmpty(const std::string& value) {
    if (value.empty()) {
        return std::nullopt;
    }
    return value;
}

std::string feedbackStyleToString(const std::optional<InterviewFeedbackStyle>& style) {
    if (!style.has_value()) {
        return "";
    }
    switch (*style) {
        case InterviewFeedbackStyle::Followup: return "followup";
        case InterviewFeedbackStyle::Corrective: return "corrective";
        case InterviewFeedbackStyle::Guided: return "guided";
    }
    return "";
}

std::optional<InterviewFeedbackStyle> stringToFeedbackStyle(const std::string& value) {
    if (value == "followup") return InterviewFeedbackStyle::Followup;
    if (value == "corrective") return InterviewFeedbackStyle::Corrective;
    if (value == "guided") return InterviewFeedbackStyle::Guided;
    return std::nullopt;
}

std::optional<InterviewMessageRole> stringToMessageRole(const std::string& value) {
    if (value == "user") return InterviewMessageRole::User;
    if (value == "assistant") return InterviewMessageRole::Assistant;
    return std::nullopt;
}
}

MySQLSessionRepository::MySQLSessionRepository(MySQLConnectionPool& pool)
    : m_pool(pool) {}

std::string MySQLSessionRepository::buildKey(const std::string& sessionId, const std::string& threadId) const {
    return sessionId + ":" + threadId;
}

InterviewSessionSummary MySQLSessionRepository::toSummary(const InterviewSessionDetail& detail) const {
    InterviewSessionSummary summary;
    summary.sessionId = detail.sessionId;
    summary.threadId = detail.threadId;
    summary.topic = detail.topic;
    summary.questionTitle = detail.questionTitle;
    summary.feedbackStyle = detail.feedbackStyle;
    summary.messageCount = static_cast<int>(detail.messages.size());
    summary.createdAt = detail.createdAt;
    summary.updatedAt = detail.updatedAt;

    for (const auto& msg : detail.messages) {
        if (msg.role == InterviewMessageRole::User) {
            summary.latestUserMessage = msg.content;
        } else if (msg.role == InterviewMessageRole::Assistant) {
            summary.latestAssistantMessage = msg.content;
        }
    }

    return summary;
}

bool MySQLSessionRepository::recordUserMessage(const InterviewStreamRequest& request) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, request.sessionId);
    const auto escapedThreadId = escapeSql(*conn, request.threadId);
    const auto escapedTopic = escapeSql(*conn, request.topic);
    const auto escapedQuestionTitle = escapeSql(*conn, request.questionTitle);
    const auto escapedMessageId = escapeSql(*conn, request.messageId + ":user");
    const auto escapedAnswer = escapeSql(*conn, request.answer);
    const auto feedbackStyle = feedbackStyleToString(request.options.feedbackStyle);
    const auto escapedFeedbackStyle = escapeSql(*conn, feedbackStyle);

    std::ostringstream insertSessionSql;
    insertSessionSql
        << "INSERT INTO interview_sessions (session_id, thread_id, topic, question_title, feedback_style, message_count, latest_user_message, latest_assistant_message, created_at, updated_at) "
        << "VALUES ("
        << "'" << escapedSessionId << "', "
        << "'" << escapedThreadId << "', "
        << "'" << escapedTopic << "', "
        << "'" << escapedQuestionTitle << "', "
        << (feedbackStyle.empty() ? "NULL" : "'" + escapedFeedbackStyle + "'") << ", "
        << "1, "
        << "'" << escapedAnswer << "', "
        << "NULL, "
        << "UTC_TIMESTAMP(), "
        << "UTC_TIMESTAMP()"
        << ") "
        << "ON DUPLICATE KEY UPDATE "
        << "topic = VALUES(topic), "
        << "question_title = VALUES(question_title), "
        << "feedback_style = VALUES(feedback_style), "
        << "message_count = message_count + 1, "
        << "latest_user_message = VALUES(latest_user_message), "
        << "updated_at = UTC_TIMESTAMP()";

    if (!conn->update(insertSessionSql.str())) {
        return false;
    }

    std::ostringstream insertMessageSql;
    insertMessageSql
        << "INSERT INTO interview_messages (session_id, thread_id, message_id, role, content, format, status, sequence_no, created_at) "
        << "VALUES ("
        << "'" << escapedSessionId << "', "
        << "'" << escapedThreadId << "', "
        << "'" << escapedMessageId << "', "
        << "'user', "
        << "'" << escapedAnswer << "', "
        << "NULL, "
        << "NULL, "
        << "0, "
        << "UTC_TIMESTAMP()"
        << ")";

    return conn->update(insertMessageSql.str());
}

bool MySQLSessionRepository::recordAssistantMessage(
    const InterviewStreamRequest& request,
    const std::string& assistantContent)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, request.sessionId);
    const auto escapedThreadId = escapeSql(*conn, request.threadId);
    const auto escapedMessageId = escapeSql(*conn, request.messageId + ":assistant");
    const auto escapedContent = escapeSql(*conn, assistantContent);

    std::ostringstream insertMessageSql;
    insertMessageSql
        << "INSERT INTO interview_messages (session_id, thread_id, message_id, role, content, format, status, sequence_no, created_at) "
        << "VALUES ("
        << "'" << escapedSessionId << "', "
        << "'" << escapedThreadId << "', "
        << "'" << escapedMessageId << "', "
        << "'assistant', "
        << "'" << escapedContent << "', "
        << "NULL, "
        << "NULL, "
        << "1, "
        << "UTC_TIMESTAMP()"
        << ")";

    if (!conn->update(insertMessageSql.str())) {
        return false;
    }

    std::ostringstream updateSessionSql;
    updateSessionSql
        << "UPDATE interview_sessions SET "
        << "message_count = message_count + 1, "
        << "latest_assistant_message = '" << escapedContent << "', "
        << "updated_at = UTC_TIMESTAMP() "
        << "WHERE session_id = '" << escapedSessionId << "' AND thread_id = '" << escapedThreadId << "'";

    return conn->update(updateSessionSql.str());
}

std::vector<InterviewSessionSummary> MySQLSessionRepository::listSessions() {
    std::vector<InterviewSessionSummary> result;

    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return result;
    }

    std::ostringstream sql;
    sql << "SELECT session_id, thread_id, topic, question_title, feedback_style, message_count, "
        << "latest_user_message, latest_assistant_message, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') "
        << "FROM interview_sessions "
        << "ORDER BY updated_at DESC";

    if (!conn->query(sql.str())) {
        return result;
    }

    while (conn->next()) {
        InterviewSessionSummary summary;
        summary.sessionId = conn->value(0);
        summary.threadId = conn->value(1);
        summary.topic = conn->value(2);
        summary.questionTitle = conn->value(3);
        summary.feedbackStyle = stringToFeedbackStyle(conn->value(4));
        summary.messageCount = std::stoi(conn->value(5));
        summary.latestUserMessage = nullIfEmpty(conn->value(6));
        summary.latestAssistantMessage = nullIfEmpty(conn->value(7));
        summary.createdAt = conn->value(8);
        summary.updatedAt = conn->value(9);

        result.push_back(std::move(summary));
    }

    return result;
}

std::optional<InterviewSessionDetail> MySQLSessionRepository::getSession(
    const std::string& sessionId,
    const std::string& threadId)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);

    std::ostringstream sessionSql;
    sessionSql
        << "SELECT session_id, thread_id, topic, question_title, feedback_style, message_count, "
        << "latest_user_message, latest_assistant_message, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') "
        << "FROM interview_sessions "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "LIMIT 1";

    if (!conn->query(sessionSql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    InterviewSessionDetail detail;
    detail.sessionId = conn->value(0);
    detail.threadId = conn->value(1);
    detail.topic = conn->value(2);
    detail.questionTitle = conn->value(3);
    detail.feedbackStyle = stringToFeedbackStyle(conn->value(4));
    detail.messageCount = std::stoi(conn->value(5));
    detail.latestUserMessage = nullIfEmpty(conn->value(6));
    detail.latestAssistantMessage = nullIfEmpty(conn->value(7));
    detail.createdAt = conn->value(8);
    detail.updatedAt = conn->value(9);

    std::ostringstream messageSql;
    messageSql
        << "SELECT role, content, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') "
        << "FROM interview_messages "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "ORDER BY created_at ASC, id ASC";

    if (!conn->query(messageSql.str())) {
        return std::nullopt;
    }

    while (conn->next()) {
        const auto roleOpt = stringToMessageRole(conn->value(0));
        if (!roleOpt.has_value()) {
            continue;
        }

        InterviewMessage msg;
        msg.role = *roleOpt;
        msg.content = conn->value(1);
        msg.createdAt = conn->value(2);
        detail.messages.push_back(std::move(msg));
    }

    return detail;
}

std::vector<InterviewSessionDetail> MySQLSessionRepository::listSessionsBySessionId(
    const std::string& sessionId)
{
    std::vector<InterviewSessionDetail> result;

    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return result;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);

    std::ostringstream sql;
    sql << "SELECT thread_id "
        << "FROM interview_sessions "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "ORDER BY updated_at ASC";

    if (!conn->query(sql.str())) {
        return result;
    }

    std::vector<std::string> threadIds;
    while (conn->next()) {
        threadIds.push_back(conn->value(0));
    }

    // 继续使用当前连接加载每个 thread 的完整详情，避免在循环里再次 acquire()。
    for (const auto& threadId : threadIds) {
        const auto escapedThreadId = escapeSql(*conn, threadId);

        std::ostringstream sessionSql;
        sessionSql
            << "SELECT session_id, thread_id, topic, question_title, feedback_style, message_count, "
            << "latest_user_message, latest_assistant_message, "
            << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
            << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') "
            << "FROM interview_sessions "
            << "WHERE session_id = '" << escapedSessionId << "' "
            << "AND thread_id = '" << escapedThreadId << "' "
            << "LIMIT 1";

        if (!conn->query(sessionSql.str()) || !conn->next()) {
            continue;
        }

        InterviewSessionDetail detail;
        detail.sessionId = conn->value(0);
        detail.threadId = conn->value(1);
        detail.topic = conn->value(2);
        detail.questionTitle = conn->value(3);
        detail.feedbackStyle = stringToFeedbackStyle(conn->value(4));
        detail.messageCount = std::stoi(conn->value(5));
        detail.latestUserMessage = nullIfEmpty(conn->value(6));
        detail.latestAssistantMessage = nullIfEmpty(conn->value(7));
        detail.createdAt = conn->value(8);
        detail.updatedAt = conn->value(9);

        std::ostringstream messageSql;
        messageSql
            << "SELECT role, content, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') "
            << "FROM interview_messages "
            << "WHERE session_id = '" << escapedSessionId << "' "
            << "AND thread_id = '" << escapedThreadId << "' "
            << "ORDER BY created_at ASC, id ASC";

        if (!conn->query(messageSql.str())) {
            continue;
        }

        while (conn->next()) {
            const auto roleOpt = stringToMessageRole(conn->value(0));
            if (!roleOpt.has_value()) {
                continue;
            }

            InterviewMessage msg;
            msg.role = *roleOpt;
            msg.content = conn->value(1);
            msg.createdAt = conn->value(2);
            detail.messages.push_back(std::move(msg));
        }

        result.push_back(std::move(detail));
    }

    return result;
}

void MySQLSessionRepository::clearAll() {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return;
    }

    conn->transaction();
    const bool ok1 = conn->update("DELETE FROM interview_messages");
    const bool ok2 = conn->update("DELETE FROM interview_sessions");

    if (ok1 && ok2) {
        conn->commit();
    } else {
        conn->rollback();
    }
}

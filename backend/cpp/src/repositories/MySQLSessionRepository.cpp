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

std::string isoUtcToMysqlDatetime(const std::string& isoUtc) {
    std::string out = isoUtc;
    if (!out.empty() && out.back() == 'Z') {
        out.pop_back();
    }
    for (char& ch : out) {
        if (ch == 'T') {
            ch = ' ';
            break;
        }
    }
    return out;
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

std::string messageRoleToString(InterviewMessageRole role) {
    return role == InterviewMessageRole::User ? "user" : "assistant";
}

std::optional<InterviewMessageRole> stringToMessageRole(const std::string& value) {
    if (value == "user") return InterviewMessageRole::User;
    if (value == "assistant") return InterviewMessageRole::Assistant;
    return std::nullopt;
}

template <typename T>
bool containsValue(const std::optional<T>& opt) {
    return opt.has_value();
}
}

MySQLSessionRepository::MySQLSessionRepository(MySQLConn& conn)
    : m_conn(conn) {}

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
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(m_conn, request.sessionId);
    const auto escapedThreadId = escapeSql(m_conn, request.threadId);
    const auto escapedTopic = escapeSql(m_conn, request.topic);
    const auto escapedQuestionTitle = escapeSql(m_conn, request.questionTitle);
    const auto escapedMessageId = escapeSql(m_conn, request.messageId + ":user");
    const auto escapedAnswer = escapeSql(m_conn, request.answer);
    const auto feedbackStyle = feedbackStyleToString(request.options.feedbackStyle);
    const auto escapedFeedbackStyle = escapeSql(m_conn, feedbackStyle);

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

    if (!m_conn.update(insertSessionSql.str())) {
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

    return m_conn.update(insertMessageSql.str());
}

bool MySQLSessionRepository::recordAssistantMessage(
    const InterviewStreamRequest& request,
    const std::string& assistantContent)
{
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(m_conn, request.sessionId);
    const auto escapedThreadId = escapeSql(m_conn, request.threadId);
    const auto escapedMessageId = escapeSql(m_conn, request.messageId + ":assistant");
    const auto escapedContent = escapeSql(m_conn, assistantContent);

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

    if (!m_conn.update(insertMessageSql.str())) {
        return false;
    }

    std::ostringstream updateSessionSql;
    updateSessionSql
        << "UPDATE interview_sessions SET "
        << "message_count = message_count + 1, "
        << "latest_assistant_message = '" << escapedContent << "', "
        << "updated_at = UTC_TIMESTAMP() "
        << "WHERE session_id = '" << escapedSessionId << "' AND thread_id = '" << escapedThreadId << "'";

    return m_conn.update(updateSessionSql.str());
}

std::vector<InterviewSessionSummary> MySQLSessionRepository::listSessions() {
    std::vector<InterviewSessionSummary> result;

    if (!m_conn.isConnected()) {
        return result;
    }

    std::ostringstream sql;
    sql << "SELECT session_id, thread_id, topic, question_title, feedback_style, message_count, "
        << "latest_user_message, latest_assistant_message, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') "
        << "FROM interview_sessions "
        << "ORDER BY updated_at DESC";

    if (!m_conn.query(sql.str())) {
        return result;
    }

    while (m_conn.next()) {
        InterviewSessionSummary summary;
        summary.sessionId = m_conn.value(0);
        summary.threadId = m_conn.value(1);
        summary.topic = m_conn.value(2);
        summary.questionTitle = m_conn.value(3);
        summary.feedbackStyle = stringToFeedbackStyle(m_conn.value(4));
        summary.messageCount = std::stoi(m_conn.value(5));
        summary.latestUserMessage = nullIfEmpty(m_conn.value(6));
        summary.latestAssistantMessage = nullIfEmpty(m_conn.value(7));
        summary.createdAt = m_conn.value(8);
        summary.updatedAt = m_conn.value(9);

        result.push_back(std::move(summary));
    }

    return result;
}

std::optional<InterviewSessionDetail> MySQLSessionRepository::getSession(
    const std::string& sessionId,
    const std::string& threadId)
{
    if (!m_conn.isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(m_conn, sessionId);
    const auto escapedThreadId = escapeSql(m_conn, threadId);

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

    if (!m_conn.query(sessionSql.str())) {
        return std::nullopt;
    }

    if (!m_conn.next()) {
        return std::nullopt;
    }

    InterviewSessionDetail detail;
    detail.sessionId = m_conn.value(0);
    detail.threadId = m_conn.value(1);
    detail.topic = m_conn.value(2);
    detail.questionTitle = m_conn.value(3);
    detail.feedbackStyle = stringToFeedbackStyle(m_conn.value(4));
    detail.messageCount = std::stoi(m_conn.value(5));
    detail.latestUserMessage = nullIfEmpty(m_conn.value(6));
    detail.latestAssistantMessage = nullIfEmpty(m_conn.value(7));
    detail.createdAt = m_conn.value(8);
    detail.updatedAt = m_conn.value(9);

    std::ostringstream messageSql;
    messageSql
        << "SELECT role, content, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') "
        << "FROM interview_messages "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "ORDER BY created_at ASC, id ASC";

    if (!m_conn.query(messageSql.str())) {
        return std::nullopt;
    }

    while (m_conn.next()) {
        const auto roleOpt = stringToMessageRole(m_conn.value(0));
        if (!roleOpt.has_value()) {
            continue;
        }

        InterviewMessage msg;
        msg.role = *roleOpt;
        msg.content = m_conn.value(1);
        msg.createdAt = m_conn.value(2);
        detail.messages.push_back(std::move(msg));
    }

    return detail;
}

std::vector<InterviewSessionDetail> MySQLSessionRepository::listSessionsBySessionId(
    const std::string& sessionId)
{
    std::vector<InterviewSessionDetail> result;

    if (!m_conn.isConnected()) {
        return result;
    }

    const auto escapedSessionId = escapeSql(m_conn, sessionId);

    std::ostringstream sql;
    sql << "SELECT thread_id "
        << "FROM interview_sessions "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "ORDER BY updated_at ASC";

    if (!m_conn.query(sql.str())) {
        return result;
    }

    std::vector<std::string> threadIds;
    while (m_conn.next()) {
        threadIds.push_back(m_conn.value(0));
    }

    for (const auto& threadId : threadIds) {
        auto detail = getSession(sessionId, threadId);
        if (detail.has_value()) {
            result.push_back(std::move(*detail));
        }
    }

    return result;
}

void MySQLSessionRepository::clearAll() {
    if (!m_conn.isConnected()) {
        return;
    }

    m_conn.transaction();
    const bool ok1 = m_conn.update("DELETE FROM interview_messages");
    const bool ok2 = m_conn.update("DELETE FROM interview_sessions");

    if (ok1 && ok2) {
        m_conn.commit();
    } else {
        m_conn.rollback();
    }
}

#include "repositories/MySQLStreamCheckpointRepository.hpp"

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
}

MySQLStreamCheckpointRepository::MySQLStreamCheckpointRepository(MySQLConnectionPool& pool)
    : m_pool(pool) {}

std::optional<InterviewStreamCheckpointRecord> MySQLStreamCheckpointRepository::getByKey(
    const std::string& sessionId,
    const std::string& threadId,
    const std::string& idempotentKey) const
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);
    const auto escapedKey = escapeSql(*conn, idempotentKey);

    std::ostringstream sql;
    sql << "SELECT session_id, thread_id, message_id, idempotent_key, user_id, status, "
        << "content, last_sequence, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(completed_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "error_code, error_message "
        << "FROM interview_stream_checkpoints "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "AND idempotent_key = '" << escapedKey << "' "
        << "LIMIT 1";

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    InterviewStreamCheckpointRecord record;
    record.sessionId = conn->value(0);
    record.threadId = conn->value(1);
    record.messageId = conn->value(2);
    record.idempotentKey = conn->value(3);
    record.userId = nullIfEmpty(conn->value(4)).has_value()
        ? std::optional<long long>(std::stoll(conn->value(4)))
        : std::nullopt;
    record.status = conn->value(5);
    record.content = conn->value(6);
    record.lastSequence = std::stoi(conn->value(7));
    record.createdAt = conn->value(8);
    record.updatedAt = conn->value(9);
    record.completedAt = nullIfEmpty(conn->value(10));
    record.errorCode = nullIfEmpty(conn->value(11));
    record.errorMessage = nullIfEmpty(conn->value(12));

    return record;
}

std::optional<InterviewStreamCheckpointRecord> MySQLStreamCheckpointRepository::getLatestBySessionThread(
    const std::string& sessionId,
    const std::string& threadId) const
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);

    std::ostringstream sql;
    sql << "SELECT session_id, thread_id, message_id, idempotent_key, user_id, status, "
        << "content, last_sequence, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "DATE_FORMAT(completed_at, '%Y-%m-%dT%H:%i:%sZ'), "
        << "error_code, error_message "
        << "FROM interview_stream_checkpoints "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "ORDER BY updated_at DESC, id DESC "
        << "LIMIT 1";

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    InterviewStreamCheckpointRecord record;
    record.sessionId = conn->value(0);
    record.threadId = conn->value(1);
    record.messageId = conn->value(2);
    record.idempotentKey = conn->value(3);
    record.userId = nullIfEmpty(conn->value(4)).has_value()
        ? std::optional<long long>(std::stoll(conn->value(4)))
        : std::nullopt;
    record.status = conn->value(5);
    record.content = conn->value(6);
    record.lastSequence = std::stoi(conn->value(7));
    record.createdAt = conn->value(8);
    record.updatedAt = conn->value(9);
    record.completedAt = nullIfEmpty(conn->value(10));
    record.errorCode = nullIfEmpty(conn->value(11));
    record.errorMessage = nullIfEmpty(conn->value(12));

    return record;
}

bool MySQLStreamCheckpointRepository::upsertStart(const InterviewStreamCheckpointRecord& checkpoint) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, checkpoint.sessionId);
    const auto escapedThreadId = escapeSql(*conn, checkpoint.threadId);
    const auto escapedMessageId = escapeSql(*conn, checkpoint.messageId);
    const auto escapedKey = escapeSql(*conn, checkpoint.idempotentKey);
    const auto escapedContent = escapeSql(*conn, checkpoint.content);
    const auto createdAt = isoUtcToMysqlDatetime(checkpoint.createdAt.empty() ? checkpoint.updatedAt : checkpoint.createdAt);
    const auto updatedAt = isoUtcToMysqlDatetime(checkpoint.updatedAt);

    std::ostringstream sql;
    sql << "INSERT INTO interview_stream_checkpoints ("
        << "session_id, thread_id, message_id, idempotent_key, user_id, status, content, last_sequence, "
        << "created_at, updated_at, completed_at, error_code, error_message"
        << ") VALUES ("
        << "'" << escapedSessionId << "', "
        << "'" << escapedThreadId << "', "
        << "'" << escapedMessageId << "', "
        << "'" << escapedKey << "', "
        << (checkpoint.userId ? std::to_string(*checkpoint.userId) : "NULL") << ", "
        << "'streaming', "
        << "'" << escapedContent << "', "
        << checkpoint.lastSequence << ", "
        << "'" << createdAt << "', "
        << "'" << updatedAt << "', "
        << "NULL, NULL, NULL"
        << ") "
        << "ON DUPLICATE KEY UPDATE "
        << "message_id = VALUES(message_id), "
        << "user_id = VALUES(user_id), "
        << "status = 'streaming', "
        << "content = '', "
        << "last_sequence = 0, "
        << "updated_at = VALUES(updated_at), "
        << "completed_at = NULL, "
        << "error_code = NULL, "
        << "error_message = NULL";

    return conn->update(sql.str());
}

bool MySQLStreamCheckpointRepository::appendChunk(
    const std::string& sessionId,
    const std::string& threadId,
    const std::string& idempotentKey,
    const std::string& chunk)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);
    const auto escapedKey = escapeSql(*conn, idempotentKey);
    const auto escapedChunk = escapeSql(*conn, chunk);

    std::ostringstream sql;
    sql << "UPDATE interview_stream_checkpoints SET "
        << "content = CONCAT(content, '" << escapedChunk << "'), "
        << "last_sequence = last_sequence + 1, "
        << "updated_at = UTC_TIMESTAMP() "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "AND idempotent_key = '" << escapedKey << "'";

    return conn->update(sql.str());
}

bool MySQLStreamCheckpointRepository::complete(
    const std::string& sessionId,
    const std::string& threadId,
    const std::string& idempotentKey)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);
    const auto escapedKey = escapeSql(*conn, idempotentKey);

    std::ostringstream sql;
    sql << "UPDATE interview_stream_checkpoints SET "
        << "status = 'done', "
        << "updated_at = UTC_TIMESTAMP(), "
        << "completed_at = UTC_TIMESTAMP(), "
        << "error_code = NULL, "
        << "error_message = NULL "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "AND idempotent_key = '" << escapedKey << "'";

    return conn->update(sql.str());
}

bool MySQLStreamCheckpointRepository::fail(
    const std::string& sessionId,
    const std::string& threadId,
    const std::string& idempotentKey,
    const std::string& code,
    const std::string& message,
    const std::string& status)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);
    const auto escapedThreadId = escapeSql(*conn, threadId);
    const auto escapedKey = escapeSql(*conn, idempotentKey);
    const auto escapedCode = escapeSql(*conn, code);
    const auto escapedMessage = escapeSql(*conn, message);
    const auto escapedStatus = escapeSql(*conn, status);

    std::ostringstream sql;
    sql << "UPDATE interview_stream_checkpoints SET "
        << "status = '" << escapedStatus << "', "
        << "updated_at = UTC_TIMESTAMP(), "
        << "error_code = '" << escapedCode << "', "
        << "error_message = '" << escapedMessage << "' "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "AND thread_id = '" << escapedThreadId << "' "
        << "AND idempotent_key = '" << escapedKey << "'";

    return conn->update(sql.str());
}

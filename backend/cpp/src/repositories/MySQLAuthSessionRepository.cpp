#include "repositories/MySQLAuthSessionRepository.hpp"

namespace {
// 使用当前连接做 SQL 转义，避免注入。
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
}

MySQLAuthSessionRepository::MySQLAuthSessionRepository(MySQLConnectionPool& pool)
    : m_pool(pool) {}

std::optional<AuthSessionRecord> MySQLAuthSessionRepository::findByToken(const std::string& token) const {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedToken = escapeSql(*conn, token);

    std::ostringstream sql;
    sql << "SELECT token, username, role, display_name, "
        << "DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%sZ') AS expires_at, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at "
        << "FROM auth_sessions "
        << "WHERE token = '" << escapedToken << "' "
        << "AND revoked_at IS NULL "
        << "AND expires_at > UTC_TIMESTAMP() "
        << "LIMIT 1";

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    AuthSessionRecord session;
    session.token = conn->value(0);
    session.username = conn->value(1);
    session.role = conn->value(2);
    session.displayName = conn->value(3);
    session.expiresAt = conn->value(4);
    session.createdAt = conn->value(5);
    return session;
}

void MySQLAuthSessionRepository::save(const AuthSessionRecord& session) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return;
    }

    const auto escapedToken = escapeSql(*conn, session.token);
    const auto escapedUsername = escapeSql(*conn, session.username);
    const auto escapedRole = escapeSql(*conn, session.role);
    const auto escapedDisplayName = escapeSql(*conn, session.displayName);
    const auto escapedCreatedAt = escapeSql(*conn, session.createdAt.empty() ? "1970-01-01 00:00:00" : isoUtcToMysqlDatetime(session.createdAt));
    const auto escapedExpiresAt = escapeSql(*conn, session.expiresAt.empty() ? "1970-01-01 00:00:00" : isoUtcToMysqlDatetime(session.expiresAt));

    std::ostringstream userSql;
    userSql << "SELECT id FROM users "
            << "WHERE username = '" << escapedUsername << "' "
            << "LIMIT 1";

    if (!conn->query(userSql.str()) || !conn->next()) {
        return;
    }

    std::ostringstream sql;
    sql << "INSERT INTO auth_sessions (token, user_id, username, role, display_name, created_at, expires_at, revoked_at, last_active_at) "
        << "VALUES ("
        << "'" << escapedToken << "', "
        << conn->value(0) << ", "
        << "'" << escapedUsername << "', "
        << "'" << escapedRole << "', "
        << "'" << escapedDisplayName << "', "
        << "'" << escapedCreatedAt << "', "
        << "'" << escapedExpiresAt << "', "
        << "NULL, "
        << "NULL) "
        << "ON DUPLICATE KEY UPDATE "
        << "username = VALUES(username), "
        << "role = VALUES(role), "
        << "display_name = VALUES(display_name), "
        << "created_at = VALUES(created_at), "
        << "expires_at = VALUES(expires_at), "
        << "revoked_at = NULL, "
        << "last_active_at = NULL";

    conn->update(sql.str());
}

void MySQLAuthSessionRepository::revoke(const std::string& token) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return;
    }

    const auto escapedToken = escapeSql(*conn, token);

    std::ostringstream sql;
    sql << "UPDATE auth_sessions "
        << "SET revoked_at = UTC_TIMESTAMP() "
        << "WHERE token = '" << escapedToken << "'";

    conn->update(sql.str());
}

void MySQLAuthSessionRepository::cleanupExpired() {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return;
    }

    std::ostringstream sql;
    sql << "DELETE FROM auth_sessions "
        << "WHERE expires_at <= UTC_TIMESTAMP() "
        << "OR revoked_at IS NOT NULL";

    conn->update(sql.str());
}

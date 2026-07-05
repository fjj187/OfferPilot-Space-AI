#include "repositories/MySQLAuthSessionRepository.hpp"

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

std::string isoUtcToMysqlDatetime(const std::string& isoUtc) {//将ISO 8601格式的UTC时间字符串转换为MySQL DATETIME格式的字符串
    // 输入: 2026-07-05T12:34:56Z
    // 输出: 2026-07-05 12:34:56
    std::string out = isoUtc;//创建一个字符串变量out，并将isoUtc的值赋给它
    if (!out.empty() && out.back() == 'Z') {
        out.pop_back();
    }//检查字符串是否非空且最后一个字符为'Z'，如果是，则移除最后一个字符

    for (char& ch : out) {
        if (ch == 'T') {
            ch = ' ';
            break;
        }
    }

    return out;
}

std::string mysqlDatetimeToIsoUtc(const std::string& mysqlDatetime) {//将MySQL DATETIME格式的字符串转换为ISO 8601格式的UTC时间字符串
    // 输入: 2026-07-05 12:34:56
    // 输出: 2026-07-05T12:34:56Z
    std::string out = mysqlDatetime;
    for (char& ch : out) {
        if (ch == ' ') {
            ch = 'T';
            break;
        }
    }
    return out + "Z";
}

bool isValidRow() {//检查当前行数据是否有效
    return true;
}
}

MySQLAuthSessionRepository::MySQLAuthSessionRepository(MySQLConn& conn)
    : m_conn(conn) {}

std::optional<AuthSessionRecord> MySQLAuthSessionRepository::findByToken(const std::string& token) const {
    if (!m_conn.isConnected()) {
        return std::nullopt;
    }

    const auto escapedToken = escapeSql(m_conn, token);

    std::ostringstream sql;
    sql << "SELECT token, username, role, display_name, "
        << "DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%sZ') AS expires_at, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at "
        << "FROM auth_sessions "
        << "WHERE token = '" << escapedToken << "' "
        << "AND revoked_at IS NULL "
        << "AND expires_at > UTC_TIMESTAMP() "
        << "LIMIT 1";

    if (!m_conn.query(sql.str())) {
        return std::nullopt;
    }

    if (!m_conn.next()) {
        return std::nullopt;
    }

    AuthSessionRecord session;
    session.token = m_conn.value(0);
    session.username = m_conn.value(1);
    session.role = m_conn.value(2);
    session.displayName = m_conn.value(3);
    session.expiresAt = m_conn.value(4);
    session.createdAt = m_conn.value(5);
    return session;
}

void MySQLAuthSessionRepository::save(const AuthSessionRecord& session) {
    if (!m_conn.isConnected()) {
        return;
    }

    const auto escapedToken = escapeSql(m_conn, session.token);
    const auto escapedUsername = escapeSql(m_conn, session.username);
    const auto escapedRole = escapeSql(m_conn, session.role);
    const auto escapedDisplayName = escapeSql(m_conn, session.displayName);
    const auto escapedCreatedAt = escapeSql(m_conn, session.createdAt.empty() ? "1970-01-01 00:00:00" : isoUtcToMysqlDatetime(session.createdAt));
    const auto escapedExpiresAt = escapeSql(m_conn, session.expiresAt.empty() ? "1970-01-01 00:00:00" : isoUtcToMysqlDatetime(session.expiresAt));

    std::ostringstream userSql;
    userSql << "SELECT id FROM users "
            << "WHERE username = '" << escapedUsername << "' "
            << "LIMIT 1";

    if (!m_conn.query(userSql.str()) || !m_conn.next()) {
        return;
    }

    std::ostringstream sql;
    sql << "INSERT INTO auth_sessions (token, user_id, username, role, display_name, created_at, expires_at, revoked_at, last_active_at) "
        << "VALUES ("
        << "'" << escapedToken << "', "
        << m_conn.value(0) << ", "
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

    m_conn.update(sql.str());
}

void MySQLAuthSessionRepository::revoke(const std::string& token) {
    if (!m_conn.isConnected()) {
        return;
    }

    const auto escapedToken = escapeSql(m_conn, token);

    std::ostringstream sql;
    sql << "UPDATE auth_sessions "
        << "SET revoked_at = UTC_TIMESTAMP() "
        << "WHERE token = '" << escapedToken << "'";

    m_conn.update(sql.str());
}

void MySQLAuthSessionRepository::cleanupExpired() {
    if (!m_conn.isConnected()) {
        return;
    }

    std::ostringstream sql;
    sql << "DELETE FROM auth_sessions "
        << "WHERE expires_at <= UTC_TIMESTAMP() "
        << "OR revoked_at IS NOT NULL";

    m_conn.update(sql.str());
}

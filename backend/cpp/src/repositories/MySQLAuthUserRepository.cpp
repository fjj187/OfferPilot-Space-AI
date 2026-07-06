#include "repositories/MySQLAuthUserRepository.hpp"

namespace {
// 用当前连接执行 mysql_real_escape_string，避免 SQL 注入。
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

bool toBool(const std::string& value) {
    return value == "1" || value == "true";
}
}

MySQLAuthUserRepository::MySQLAuthUserRepository(MySQLConnectionPool& pool)
    : m_pool(pool) {}

std::optional<AuthUserRecord> MySQLAuthUserRepository::findByUsername(const std::string& username) const {
    // 每次查询临时从连接池借一个连接，用完自动归还。
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedUsername = escapeSql(*conn, username);

    std::ostringstream sql;
    sql << "SELECT username, role, display_name, password_hash, salt, enabled "
        << "FROM users "
        << "WHERE username = '" << escapedUsername << "' "
        << "LIMIT 1";

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    AuthUserRecord user;
    user.username = conn->value(0);
    user.role = conn->value(1);
    user.displayName = conn->value(2);
    user.passwordHash = conn->value(3);
    user.salt = conn->value(4);
    user.enabled = toBool(conn->value(5));
    return user;
}

std::optional<AuthUserRecord> MySQLAuthUserRepository::findById(long long id) const {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    std::ostringstream sql;
    sql << "SELECT username, role, display_name, password_hash, salt, enabled "
        << "FROM users "
        << "WHERE id = " << id
        << " LIMIT 1";

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    AuthUserRecord user;
    user.username = conn->value(0);
    user.role = conn->value(1);
    user.displayName = conn->value(2);
    user.passwordHash = conn->value(3);
    user.salt = conn->value(4);
    user.enabled = toBool(conn->value(5));
    return user;
}

bool MySQLAuthUserRepository::createUser(
    const AuthUserRecord& user,
    const std::string& passwordHash,
    const std::string& salt)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto username = escapeSql(*conn, user.username);
    const auto role = escapeSql(*conn, user.role);
    const auto displayName = escapeSql(*conn, user.displayName);
    const auto hash = escapeSql(*conn, passwordHash);
    const auto escapedSalt = escapeSql(*conn, salt);
    const auto enabledValue = user.enabled ? "1" : "0";

    std::ostringstream sql;
    sql << "INSERT INTO users (username, role, display_name, password_hash, salt, enabled) VALUES ("
        << "'" << username << "', "
        << "'" << role << "', "
        << "'" << displayName << "', "
        << "'" << hash << "', "
        << "'" << escapedSalt << "', "
        << enabledValue
        << ")";

    return conn->update(sql.str());
}

bool MySQLAuthUserRepository::updatePassword(
    const std::string& username,
    const std::string& passwordHash,
    const std::string& salt)
{
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedUsername = escapeSql(*conn, username);
    const auto escapedHash = escapeSql(*conn, passwordHash);
    const auto escapedSalt = escapeSql(*conn, salt);

    std::ostringstream sql;
    sql << "UPDATE users SET "
        << "password_hash = '" << escapedHash << "', "
        << "salt = '" << escapedSalt << "' "
        << "WHERE username = '" << escapedUsername << "'";

    return conn->update(sql.str());
}

bool MySQLAuthUserRepository::setEnabled(const std::string& username, bool enabled) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedUsername = escapeSql(*conn, username);

    std::ostringstream sql;
    sql << "UPDATE users SET "
        << "enabled = " << (enabled ? 1 : 0) << " "
        << "WHERE username = '" << escapedUsername << "'";

    return conn->update(sql.str());
}

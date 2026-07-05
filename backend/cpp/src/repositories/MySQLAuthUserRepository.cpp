#include "repositories/MySQLAuthUserRepository.hpp"

namespace {
std::string escapeSql(MySQLConn& conn, const std::string& input) {
    std::string escaped;//创建一个空字符串用于存储转义后的结果
    escaped.resize(input.size() * 2 + 1);//为转义后的字符串分配足够的空间，最大长度为原始字符串长度的两倍加一

    const unsigned long len = mysql_real_escape_string(
        conn.raw(),
        escaped.data(),
        input.c_str(),
        static_cast<unsigned long>(input.size())
    );//调用mysql_real_escape_string函数进行转义，传入数据库连接对象、目标缓冲区、源字符串和源字符串长度，返回转义后的长度

    escaped.resize(len);//调整转义后的字符串大小以匹配实际长度
    return escaped;//调整转义后的字符串大小以匹配实际长度，并返回转义后的字符串
}

bool toBool(const std::string& value) {
    return value == "1" || value == "true";//将字符串值转换为布尔值，如果值为"1"或"true"，则返回true，否则返回false
}
}

MySQLAuthUserRepository::MySQLAuthUserRepository(MySQLConn& conn)
    : m_conn(conn) {}

std::optional<AuthUserRecord> MySQLAuthUserRepository::findByUsername(const std::string& username) const {
    if (!m_conn.isConnected()) {
        return std::nullopt;
    }//检查数据库连接是否已建立，如果未连接，则返回空的std::optional对象
    const auto escapedUsername = escapeSql(m_conn, username);//调用escapeSql函数对用户名进行转义，防止SQL注入攻击

    std::ostringstream sql;
    sql << "SELECT username, role, display_name, password_hash, salt, enabled "
        << "FROM users "
        << "WHERE username = '" << escapedUsername << "' "
        << "LIMIT 1";

    if (!m_conn.query(sql.str())) {
        return std::nullopt;
    }

    if (!m_conn.next()) {
        return std::nullopt;
    }
    AuthUserRecord user;//创建一个AuthUserRecord对象用于存储查询结果
    user.username = m_conn.value(0);
    user.role = m_conn.value(1);
    user.displayName = m_conn.value(2);
    user.passwordHash = m_conn.value(3);
    user.salt = m_conn.value(4);
    user.enabled = toBool(m_conn.value(5));
    return user;
}

std::optional<AuthUserRecord> MySQLAuthUserRepository::findById(long long id) const {
    if (!m_conn.isConnected()) {
        return std::nullopt;
    }

    std::ostringstream sql;
    sql << "SELECT username, role, display_name, password_hash, salt, enabled "
        << "FROM users "
        << "WHERE id = " << id
        << " LIMIT 1";

    if (!m_conn.query(sql.str())) {
        return std::nullopt;
    }

    if (!m_conn.next()) {
        return std::nullopt;
    }

    AuthUserRecord user;
    user.username = m_conn.value(0);
    user.role = m_conn.value(1);
    user.displayName = m_conn.value(2);
    user.passwordHash = m_conn.value(3);
    user.salt = m_conn.value(4);
    user.enabled = toBool(m_conn.value(5));
    return user;
}

bool MySQLAuthUserRepository::createUser(
    const AuthUserRecord& user,//创建新用户
    const std::string& passwordHash,//用户密码的哈希值
    const std::string& salt)//用户密码的盐值
{
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto username = escapeSql(m_conn, user.username);//调用escapeSql函数对用户名进行转义，防止SQL注入攻击
    const auto role = escapeSql(m_conn, user.role);//调用escapeSql函数对用户角色进行转义，防止SQL注入攻击
    const auto displayName = escapeSql(m_conn, user.displayName);//调用escapeSql函数对用户显示名称进行转义，防止SQL注入攻击
    const auto hash = escapeSql(m_conn, passwordHash);//调用escapeSql函数对密码哈希值进行转义，防止SQL注入攻击
    const auto escapedSalt = escapeSql(m_conn, salt);//调用escapeSql函数对盐值进行转义，防止SQL注入攻击
    const auto enabledValue = user.enabled ? "1" : "0";//将布尔值转换为字符串表示，"1"表示启用，"0"表示禁用

    std::ostringstream sql;
    sql << "INSERT INTO users (username, role, display_name, password_hash, salt, enabled) VALUES ("
        << "'" << username << "', "
        << "'" << role << "', "
        << "'" << displayName << "', "
        << "'" << hash << "', "
        << "'" << escapedSalt << "', "
        << enabledValue
        << ")";

    return m_conn.update(sql.str());
}

bool MySQLAuthUserRepository::updatePassword(
    const std::string& username,
    const std::string& passwordHash,
    const std::string& salt)
{
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto escapedUsername = escapeSql(m_conn, username);
    const auto escapedHash = escapeSql(m_conn, passwordHash);
    const auto escapedSalt = escapeSql(m_conn, salt);

    std::ostringstream sql;
    sql << "UPDATE users SET "
        << "password_hash = '" << escapedHash << "', "
        << "salt = '" << escapedSalt << "' "
        << "WHERE username = '" << escapedUsername << "'";

    return m_conn.update(sql.str());
}

bool MySQLAuthUserRepository::setEnabled(const std::string& username, bool enabled) {
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto escapedUsername = escapeSql(m_conn, username);

    std::ostringstream sql;
    sql << "UPDATE users SET "
        << "enabled = " << (enabled ? 1 : 0) << " "
        << "WHERE username = '" << escapedUsername << "'";

    return m_conn.update(sql.str());
}
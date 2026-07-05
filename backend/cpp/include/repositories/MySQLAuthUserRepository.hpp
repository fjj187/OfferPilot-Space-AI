#pragma once
#include <optional>
#include <string>
#include "repositories/IAuthUserRepository.hpp"
#include <sstream>
#include "MySQLConn.hpp"

class MySQLAuthUserRepository : public IAuthUserRepository {
public:
    explicit MySQLAuthUserRepository(MySQLConn& conn);

    std::optional<AuthUserRecord> findByUsername(const std::string& username) const override;//实现IAuthUserRepository接口中的findByUsername方法，用于根据用户名查找用户记录
    std::optional<AuthUserRecord> findById(long long id) const;//根据用户ID查找用户记录

    bool createUser(const AuthUserRecord& user, const std::string& passwordHash, const std::string& salt);//创建新用户
    bool updatePassword(const std::string& username, const std::string& passwordHash, const std::string& salt);//更新用户密码
    bool setEnabled(const std::string& username, bool enabled);//设置用户启用状态

private:
    MySQLConn& m_conn;
};
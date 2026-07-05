#pragma once
#include <optional>
#include <string>
#include "repositories/IAuthSessionRepository.hpp"
#include "MySQLConn.hpp"
#include <sstream>

class MySQLAuthSessionRepository : public IAuthSessionRepository {
public:
    explicit MySQLAuthSessionRepository(MySQLConn& conn);

    std::optional<AuthSessionRecord> findByToken(const std::string& token) const override;//实现IAuthSessionRepository接口中的findByToken方法，用于根据令牌查找会话记录
    void save(const AuthSessionRecord& session) override;//实现IAuthSessionRepository接口中的save方法，用于保存会话记录
    void revoke(const std::string& token) override;//实现IAuthSessionRepository接口中的revoke方法，用于撤销会话记录
    void cleanupExpired() override;//实现IAuthSessionRepository接口中的cleanupExpired方法，用于清理过期的会话记录

private:
    MySQLConn& m_conn;
};
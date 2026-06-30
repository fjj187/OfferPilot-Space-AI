#pragma once
#include <optional>
#include "types/AuthTypes.hpp"

class IAuthSessionRepository {
public:
    virtual ~IAuthSessionRepository() = default;
    virtual std::optional<AuthSessionRecord> findByToken(const std::string& token) const = 0;
    virtual void save(const AuthSessionRecord& session) = 0;
    virtual void revoke(const std::string& token) = 0;
    virtual void cleanupExpired() = 0;
};
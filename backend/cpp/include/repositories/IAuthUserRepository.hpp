#pragma once
#include "types/AuthTypes.hpp"
#include<optional>

class IAuthUserRepository {
public:
    virtual ~IAuthUserRepository() = default;
    virtual std::optional<AuthUserRecord> findByUsername(const std::string& username) const = 0;
};
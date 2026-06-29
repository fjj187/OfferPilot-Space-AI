#pragma once
#include <string>

struct AuthUserRecord {
    std::string username;
    std::string role;
    std::string displayName;
    std::string passwordHash;
    std::string salt;
    bool enabled;
};


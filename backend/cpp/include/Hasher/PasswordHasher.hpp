#pragma once
#include <string>
#include <openssl/evp.h>

class PasswordHasher {
public:
    std::string hash(const std::string& password, const std::string& salt) const;
    bool verify(const std::string& password, const std::string& salt, const std::string& expectedHash) const;
};
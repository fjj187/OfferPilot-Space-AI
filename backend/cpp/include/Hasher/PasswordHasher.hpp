#pragma once

#include <string>
#include <openssl/evp.h>

// 密码哈希工具。
// 使用 PBKDF2 + SHA256，把明文密码和 salt 转成可验证的摘要。
class PasswordHasher {
public:
    std::string hash(const std::string& password, const std::string& salt) const;
    bool verify(const std::string& password, const std::string& salt, const std::string& expectedHash) const;
};


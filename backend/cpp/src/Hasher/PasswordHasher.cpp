#include "Hasher/PasswordHasher.hpp"

namespace {
    std::string bytesToHex(const unsigned char* data, size_t len);
    bool constantTimeEquals(const std::string& a, const std::string& b);
    std::string normalizeSalt(const std::string& salt);
}

std::string PasswordHasher::hash(const std::string& password, const std::string& salt) const {
    constexpr int ITERATIONS = 100000;
    constexpr size_t HASH_LEN = 32;

    unsigned char out[HASH_LEN];
    const std::string normalizedSalt = normalizeSalt(salt);

    const int ok = PKCS5_PBKDF2_HMAC(
        password.c_str(),
        static_cast<int>(password.size()),
        reinterpret_cast<const unsigned char*>(normalizedSalt.data()),
        static_cast<int>(normalizedSalt.size()),
        ITERATIONS,
        EVP_sha256(),
        static_cast<int>(HASH_LEN),
        out
    );

    if (ok != 1) {
        return "";
    }

    return bytesToHex(out, HASH_LEN);
}

bool PasswordHasher::verify(
    const std::string& password,
    const std::string& salt,
    const std::string& expectedHash
) const {
    const std::string actualHash = hash(password, salt);
    if (actualHash.empty() || expectedHash.empty()) {
        return false;
    }

    return constantTimeEquals(actualHash, expectedHash);
}

namespace {
std::string bytesToHex(const unsigned char* data, size_t len) {
    static const char* hex = "0123456789abcdef";
    std::string out;
    out.reserve(len * 2);

    for (size_t i = 0; i < len; ++i) {
        out.push_back(hex[(data[i] >> 4) & 0x0F]);
        out.push_back(hex[data[i] & 0x0F]);
    }

    return out;
}
}

namespace {
bool constantTimeEquals(const std::string& a, const std::string& b) {
    if (a.size() != b.size()) return false;

    unsigned char diff = 0;
    for (size_t i = 0; i < a.size(); ++i) {
        diff |= static_cast<unsigned char>(a[i] ^ b[i]);
    }
    return diff == 0;
}
}

namespace {
std::string normalizeSalt(const std::string& salt) {
    return salt;
}
}
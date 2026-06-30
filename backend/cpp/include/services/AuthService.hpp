#pragma once
#include <optional>
#include "repositories/IAuthSessionRepository.hpp"
#include "repositories/IAuthUserRepository.hpp"
#include "Hasher/PasswordHasher.hpp"
#include "DTO/AuthDTO.hpp"
#include "httplib.h"
#include <openssl/rand.h>
#include <array>
#include <sstream>
#include <iomanip>

class AuthService {
public:
    AuthService(IAuthUserRepository& userRepo,
                IAuthSessionRepository& sessionRepo,
                PasswordHasher& hasher,
                int tokenTtlSeconds);

    std::optional<LoginResponseDto> login(const std::string& username, const std::string& password);
    std::optional<AuthUserDto> authenticateByRequest(const httplib::Request& req) const;
    std::optional<AuthUserDto> authenticateByToken(const std::string& token) const;
    void logout(const std::string& token);

private:
    std::optional<std::string> extractBearerToken(const httplib::Request& req) const;
    std::string generateToken() const;

    IAuthUserRepository& m_userRepo;
    IAuthSessionRepository& m_sessionRepo;
    PasswordHasher& m_hasher;
    int m_tokenTtlSeconds;
};
#include "services/AuthService.hpp"

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
std::string currentTimestampUtc() {
    auto now = std::chrono::system_clock::now();
    auto t = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::gmtime(&t);

    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

std::string addSecondsToTimestampUtc(int seconds) {
    auto now = std::chrono::system_clock::now() + std::chrono::seconds(seconds);
    auto t = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::gmtime(&t);

    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}
}

AuthService::AuthService(
    IAuthUserRepository& userRepo,
    IAuthSessionRepository& sessionRepo,
    PasswordHasher& hasher,
    int tokenTtlSeconds
)
    : m_userRepo(userRepo)
    , m_sessionRepo(sessionRepo)
    , m_hasher(hasher)
    , m_tokenTtlSeconds(tokenTtlSeconds) {}

std::optional<AuthUserDto> AuthService::authenticateByRequest(const httplib::Request& req) const {
    const auto tokenOpt = extractBearerToken(req);
    if (!tokenOpt.has_value()) {
        return std::nullopt;
    }

    return authenticateByToken(*tokenOpt);
}

std::optional<AuthUserDto> AuthService::authenticateByToken(const std::string& token) const {
    auto sessionOpt = m_sessionRepo.findByToken(token);
    if (!sessionOpt.has_value()) {
        return std::nullopt;
    }

    const auto& session = *sessionOpt;

    AuthUserDto user;
    user.username = session.username;
    user.role = session.role;
    user.displayName = session.displayName;
    return user;
}

void AuthService::logout(const std::string& token) {
    m_sessionRepo.revoke(token);
}

std::optional<std::string> AuthService::extractBearerToken(const httplib::Request& req) const {
    if (!req.has_header("Authorization")) {
        return std::nullopt;
    }

    const auto auth = req.get_header_value("Authorization");
    const std::string prefix = "Bearer ";

    if (auth.rfind(prefix, 0) != 0) {
        return std::nullopt;
    }

    auto token = auth.substr(prefix.size());
    if (token.empty()) {
        return std::nullopt;
    }

    return token;
}

std::string AuthService::generateToken() const {
    std::array<unsigned char, 32> buf{};

    if (RAND_bytes(buf.data(), static_cast<int>(buf.size())) != 1) {
        return "";
    }

    return bytesToHex(buf.data(), buf.size());
}

std::optional<LoginResponseDto> AuthService::login(const std::string& username, const std::string& password) {
    const auto userOpt = m_userRepo.findByUsername(username);
    if (!userOpt.has_value()) {
        return std::nullopt;
    }

    const auto& user = *userOpt;

    if (!user.enabled) {
        return std::nullopt;
    }

    if (!m_hasher.verify(password, user.salt, user.passwordHash)) {
        return std::nullopt;
    }

    const std::string token = generateToken();
    if (token.empty()) {
        return std::nullopt;
    }

    AuthSessionRecord session;
    session.token = token;
    session.username = user.username;
    session.role = user.role;
    session.displayName = user.displayName;
    session.createdAt = currentTimestampUtc();
    session.expiresAt = addSecondsToTimestampUtc(m_tokenTtlSeconds);

    m_sessionRepo.save(session);

    LoginResponseDto resp;
    resp.token = token;
    resp.user = AuthUserDto{
        user.username,
        user.role,
        user.displayName
    };

    return resp;
}

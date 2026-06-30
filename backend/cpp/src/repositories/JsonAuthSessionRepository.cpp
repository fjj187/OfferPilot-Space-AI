#include "repositories/JsonAuthSessionRepository.hpp"

inline void to_json(nlohmann::json& j, const AuthSessionRecord& s) {
    j = nlohmann::json{
        {"token", s.token},
        {"username", s.username},
        {"role", s.role},
        {"displayName", s.displayName},
        {"expiresAt", s.expiresAt},
        {"createdAt", s.createdAt}
    };
}

inline void from_json(const nlohmann::json& j, AuthSessionRecord& s) {
    j.at("token").get_to(s.token);
    j.at("username").get_to(s.username);
    j.at("role").get_to(s.role);
    j.at("displayName").get_to(s.displayName);
    j.at("expiresAt").get_to(s.expiresAt);
    j.at("createdAt").get_to(s.createdAt);
}

JsonAuthSessionRepository::JsonAuthSessionRepository(const std::string& filePath)
    : m_filePath(filePath) {
    ensureStorageDir();
    loadFromFile();
}

std::optional<AuthSessionRecord> JsonAuthSessionRepository::findByToken(const std::string& token) const {
    auto it = m_index.find(token);
    if (it == m_index.end()) return std::nullopt;

    const auto& session = m_sessions[it->second];
    if (isExpired(session)) return std::nullopt;

    return session;
}

void JsonAuthSessionRepository::save(const AuthSessionRecord& session) {
    auto it = m_index.find(session.token);
    if (it != m_index.end()) {
        m_sessions[it->second] = session;
    } else {
        m_sessions.push_back(session);
        m_index[session.token] = m_sessions.size() - 1;
    }
    persistToFile();
}

void JsonAuthSessionRepository::revoke(const std::string& token) {
    auto it = m_index.find(token);
    if (it == m_index.end()) return;

    const size_t index = it->second;
    m_sessions.erase(m_sessions.begin() + index);
    m_index.erase(it);

    for (size_t i = index; i < m_sessions.size(); ++i) {
        m_index[m_sessions[i].token] = i;
    }

    persistToFile();
}

void JsonAuthSessionRepository::cleanupExpired() {
    std::vector<AuthSessionRecord> alive;
    alive.reserve(m_sessions.size());

    for (const auto& session : m_sessions) {
        if (!isExpired(session)) {
            alive.push_back(session);
        }
    }

    m_sessions = std::move(alive);
    m_index.clear();

    for (size_t i = 0; i < m_sessions.size(); ++i) {
        m_index[m_sessions[i].token] = i;
    }

    persistToFile();
}

bool JsonAuthSessionRepository::isExpired(const AuthSessionRecord& session) const {
    return session.expiresAt < getCurrentTimestamp();
}

void JsonAuthSessionRepository::ensureStorageDir() const {
    std::filesystem::path path(m_filePath);
    auto dir = path.parent_path();

    if (!dir.empty() && !std::filesystem::exists(dir)) {
        std::filesystem::create_directories(dir);
    }
}

void JsonAuthSessionRepository::loadFromFile() {
    m_sessions.clear();
    m_index.clear();

    if (!std::filesystem::exists(m_filePath)) {
        return;
    }

    std::ifstream inFile(m_filePath);
    if (!inFile.is_open()) {
        return;
    }

    nlohmann::json root;
    try {
        inFile >> root;
    } catch (const std::exception&) {
        return;
    }

    if (!root.contains("sessions") || !root["sessions"].is_array()) {
        return;
    }

    for (const auto& item : root["sessions"]) {
        try {
            AuthSessionRecord session;
            item.at("token").get_to(session.token);
            item.at("username").get_to(session.username);
            item.at("role").get_to(session.role);
            item.at("displayName").get_to(session.displayName);
            item.at("expiresAt").get_to(session.expiresAt);
            item.at("createdAt").get_to(session.createdAt);

            m_sessions.push_back(std::move(session));
        } catch (const std::exception&) {
            continue;
        }
    }

    for (size_t i = 0; i < m_sessions.size(); ++i) {
        m_index[m_sessions[i].token] = i;
    }
}

bool JsonAuthSessionRepository::persistToFile() {
    nlohmann::json root;
    root["sessions"] = nlohmann::json::array();

    for (const auto& session : m_sessions) {
        root["sessions"].push_back(session);
    }

    std::string tmpPath = m_filePath + ".tmp";

    {
        std::ofstream ofs(tmpPath, std::ios::out | std::ios::trunc);
        if (!ofs.is_open()) {
            return false;
        }

        try {
            ofs << root.dump(2);
        } catch (const std::exception&) {
            ofs.close();
            std::filesystem::remove(tmpPath);
            return false;
        }

        if (ofs.fail()) {
            ofs.close();
            std::filesystem::remove(tmpPath);
            return false;
        }

        ofs.close();
        if (ofs.fail()) {
            std::filesystem::remove(tmpPath);
            return false;
        }
    }

    try {
        if (std::filesystem::exists(m_filePath)) {
            std::filesystem::remove(m_filePath);
        }
        std::filesystem::rename(tmpPath, m_filePath);
    } catch (const std::filesystem::filesystem_error&) {
        std::filesystem::remove(tmpPath);
        return false;
    }

    return true;
}

std::string JsonAuthSessionRepository::getCurrentTimestamp() const {
    auto now = std::chrono::system_clock::now();
    auto timeT = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::gmtime(&timeT);

    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

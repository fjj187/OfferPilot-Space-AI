#include "repositories/JsonAuthUserRepository.hpp"

inline void to_json(nlohmann::json& j, const AuthUserRecord& u) {
    j = nlohmann::json{
        {"username", u.username},
        {"role", u.role},
        {"displayName", u.displayName},
        {"passwordHash", u.passwordHash},
        {"salt", u.salt},
        {"enabled", u.enabled}
    };
}

inline void from_json(const nlohmann::json& j, AuthUserRecord& u) {
    j.at("username").get_to(u.username);
    j.at("role").get_to(u.role);
    j.at("displayName").get_to(u.displayName);
    j.at("passwordHash").get_to(u.passwordHash);
    j.at("salt").get_to(u.salt);
    j.at("enabled").get_to(u.enabled);
}

namespace {
std::string trim(const std::string& s) {
    const auto start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) {
        return "";
    }

    const auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}
}

JsonAuthUserRepository::JsonAuthUserRepository(const std::string& filePath)
    : m_filePath(filePath) {
    ensureStorageDir();
    loadFromFile();

    for (size_t i = 0; i < m_users.size(); ++i) {
        m_index[m_users[i].username] = i;
    }
}


std::optional<AuthUserRecord> JsonAuthUserRepository::findByUsername(const std::string& username) const {
    const auto key = trim(username); // 如果你不写 trim，也至少要做空白处理
    auto it = m_index.find(key);
    if (it == m_index.end()) return std::nullopt;
    return m_users[it->second];
}

void JsonAuthUserRepository::loadFromFile() {
    m_users.clear();
    m_index.clear();

    if (!std::filesystem::exists(m_filePath)) return;

    std::ifstream inFile(m_filePath);
    if (!inFile.is_open()) return;

    nlohmann::json root;
    inFile >> root;

    if (!root.contains("users") || !root["users"].is_array()) return;

    for (const auto& item : root["users"]) {
        m_users.push_back(item.get<AuthUserRecord>());
    }

    for (size_t i = 0; i < m_users.size(); ++i) {
        m_index[m_users[i].username] = i;
    }
}

void JsonAuthUserRepository::ensureStorageDir() const {
    std::filesystem::path path(m_filePath);
    auto dir = path.parent_path();
    if (!std::filesystem::exists(dir)) {
        std::filesystem::create_directories(dir);
    }
}
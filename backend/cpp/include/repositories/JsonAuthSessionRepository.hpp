#pragma once
#include <filesystem>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>
#include "json.hpp"
#include <fstream>
#include <chrono>
#include <iomanip>
#include <sstream>

#include "repositories/IAuthSessionRepository.hpp"

class JsonAuthSessionRepository : public IAuthSessionRepository {
public:
    explicit JsonAuthSessionRepository(const std::string& filePath);

    std::optional<AuthSessionRecord> findByToken(const std::string& token) const override;
    void save(const AuthSessionRecord& session) override;
    void revoke(const std::string& token) override;
    void cleanupExpired() override;

private:
    void ensureStorageDir() const;
    void loadFromFile();
    bool persistToFile();
    bool isExpired(const AuthSessionRecord& session) const;
    std::string getCurrentTimestamp() const;

    std::string m_filePath;
    std::vector<AuthSessionRecord> m_sessions;
    std::unordered_map<std::string, size_t> m_index;
};
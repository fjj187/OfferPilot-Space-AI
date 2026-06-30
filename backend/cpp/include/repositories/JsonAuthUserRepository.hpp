#pragma once
#include <string>
#include "repositories/IAuthUserRepository.hpp"
#include <vector>
#include <unordered_map>
#include <filesystem>
#include "json.hpp"
#include <fstream>
#include <chrono>
#include <iomanip>
#include <sstream>

class JsonAuthUserRepository : public IAuthUserRepository {
public:
    JsonAuthUserRepository(const std::string& filePath);

    std::optional<AuthUserRecord> findByUsername(const std::string& username) const override;

private:
    void loadFromFile();
    void ensureStorageDir() const;

    std::string m_filePath;
    std::vector<AuthUserRecord> m_users;
    std::unordered_map<std::string, size_t> m_index;
};
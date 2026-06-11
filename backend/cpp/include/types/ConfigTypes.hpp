#pragma once
#include <string>
#include <cstdint>


struct DatabaseConfig {
    std::string host;
    uint16_t port = 3306;
    std::string user;
    std::string password;
    std::string database;
};

struct ProviderConfig {
    std::string type;      // "mock" | "remote"
    std::string endpoint;
    std::string apiKey;
    std::string model;
    int maxTokens = 1024;
};

struct BackendConfig {
    uint16_t httpPort = 8080;
    std::string storageDir;
    std::string logLevel;
    DatabaseConfig database;
    ProviderConfig provider;
};

#pragma once

#include <iostream>
#include <string>
#include <cstdlib>

// 应用配置。
// 主要从环境变量读取 HTTP 和数据库配置，启动时由 main.cpp 使用。
class AppConfig {
public:
    AppConfig();
    ~AppConfig();

    // 从环境变量加载配置。
    static AppConfig& loadFromEnv();

    // 获取单例实例。
    static AppConfig& getInstance();

    // 基础配置合法性检查。
    bool isConfigValid();

    int httpPort;
    std::string dbHost;
    int dbPort;
    std::string dbName;
    std::string dbUser;
    std::string dbPassword;
    std::string logLevel;
};


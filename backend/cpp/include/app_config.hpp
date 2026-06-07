#pragma once
#include <iostream>
#include <string>
#include <cstdlib>


class AppConfig {
public:
    AppConfig();
    ~AppConfig();
    static AppConfig& loadFromEnv();//从环境变量加载配置
    static AppConfig& getInstance();//获取单例实例
    bool isConfigValid();//检查配置是否有效
    int httpPort;//HTTP服务监听端口
    std::string dbHost;//MySQL服务器IP
    int dbPort;//MySQL端口
    std::string dbName;//MySQL数据库名称
    std::string dbUser;//MySQL用户名
    std::string dbPassword;//MySQL密码  
    std::string logLevel;//日志级别
};
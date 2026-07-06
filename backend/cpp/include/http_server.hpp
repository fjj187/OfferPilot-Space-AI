#pragma once

#include <string>

#include "httplib.h"

// 对 httplib::Server 的轻封装。
// 统一提供启动、停止、路由注册和错误处理入口。
class HttpServer {
public:
    HttpServer(int port);
    ~HttpServer();

    // 启动 HTTP 服务。
    void start();
    // 停止 HTTP 服务。
    void stop();
    // 当前是否正在运行。
    bool isRunning() const;
    // 监听端口。
    int getPort() const;
    // 注册 GET 路由。
    void get(const std::string& path, const httplib::Server::Handler& handler);
    // 注册 POST 路由。
    void post(const std::string& path, const httplib::Server::Handler& handler);
    // 配置中间件。
    void setupMiddleware();
    // 配置统一错误处理。
    void setupErrorHandler();
private:
    httplib::Server m_server;
    int m_port;
    bool m_running;
};


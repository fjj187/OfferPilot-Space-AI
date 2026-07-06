#pragma once

#include "http_server.hpp"
#include "Controller/AuthController.hpp"

// 认证相关路由注册器。
class AuthRoutes {
public:
    AuthRoutes(HttpServer& httpServer, AuthController& controller);

    // 把登录、当前用户、退出登录注册到 HTTP server 上。
    void registerRoutes();

private:
    HttpServer& m_httpServer;
    AuthController& m_controller;
};


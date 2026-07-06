#pragma once

#include <string>

#include "http_server.hpp"
#include "Controller/interview_controller.hpp"

// 面试相关路由注册器。
class InterviewRoutes {
public:
    InterviewRoutes(HttpServer& httpServer, InterviewController& controller);

    // 注册 SSE 流式面试、报告、会话历史等接口。
    void registerRoutes();

private:
    HttpServer& m_httpServer;
    InterviewController& m_controller;
};


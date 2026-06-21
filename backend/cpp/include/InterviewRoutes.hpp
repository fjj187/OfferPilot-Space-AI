#pragma once
#include <string>

#include "http_server.hpp"
#include "interview_controller.hpp"

class InterviewRoutes {
public:
    InterviewRoutes(HttpServer& httpServer, InterviewController& controller);
    void registerRoutes();//注册路由
private:
    HttpServer& m_httpServer;//HTTP服务器实例
    InterviewController& m_controller;
};

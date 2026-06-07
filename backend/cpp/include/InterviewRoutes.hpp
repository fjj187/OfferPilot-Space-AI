#pragma once
#include <string>
#include "../third_part/httplib.h"
#include "http_server.hpp"

class InterviewRoutes {
public:
    InterviewRoutes(HttpServer& httpServer);
    ~InterviewRoutes();
    void registerRoutes();//注册路由
private:
    HttpServer& m_httpServer;//HTTP服务器实例
};
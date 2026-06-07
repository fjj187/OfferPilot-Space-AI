#include "../include/InterviewRoutes.hpp"

InterviewRoutes::InterviewRoutes(HttpServer& httpServer)
    : m_httpServer(httpServer)//初始化HTTP服务器实例
{
}
InterviewRoutes::~InterviewRoutes()
{
}

void InterviewRoutes::registerRoutes()
{
    m_httpServer.post("/api/interview/stream", [](const httplib::Request& req, httplib::Response& res)
    {
        
    });
    m_httpServer.post("/api/interview/reports/generate", [](const httplib::Request& req, httplib::Response& res)
    {
        
    });
    m_httpServer.get("api/interview/stream", [](const httplib::Request& req, httplib::Response& res)
    {
        
    });
}

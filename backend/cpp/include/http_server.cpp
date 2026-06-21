#include "http_server.hpp"

HttpServer::HttpServer(int port)
    : m_server(),  //初始化HTTP服务器实例
    m_port(port),  //初始化HTTP服务监听端口
    m_running(false)  //初始化是否正在运行  
   {
}

HttpServer::~HttpServer()
{
    if(m_running){
        m_server.stop();//停止HTTP服务器
    }
}

void HttpServer::get(const std::string& path, const httplib::Server::Handler& handler)
{
    m_server.Get(path, handler);//处理GET请求
}

void HttpServer::post(const std::string& path, const httplib::Server::Handler& handler)
{
    m_server.Post(path, handler);//处理POST请求
}

void HttpServer::start()
{
    m_running = true;//设置为正在运行
    m_server.listen("0.0.0.0", m_port);//启动HTTP服务器
    if(!m_running){
        m_running = true;//确认启动成功
    }
}

void HttpServer::stop()
{
    m_server.stop();//停止HTTP服务器
    m_running = false;//设置为未运行
}

bool HttpServer::isRunning() const
{
    return m_running;//返回是否正在运行
}
int HttpServer::getPort() const
{
    return m_port;//返回HTTP服务监听端口
}

void HttpServer::setupMiddleware()
{
    
    // 所有响应添加 CORS 头,保证了所有实际请求的响应也带上 Access-Control-Allow-Origin
    m_server.set_pre_routing_handler([](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        // 如果是 OPTIONS 预检请求，可以在这里直接处理，或交给 Options 路由
        return httplib::Server::HandlerResponse::Unhandled; // 继续后续路由
    });
}
void HttpServer::setupErrorHandler()
{
    m_server.set_error_handler([](const httplib::Request&, httplib::Response& res) {
        if (res.status == 404) {
            res.set_content("{\"success\":false,\"error\":\"Not Found\"}", "application/json");
        }
    });
}

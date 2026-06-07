#pragma once
#include <iostream>
#include <string>
#include "../third_part/httplib.h"

class HttpServer {
public:
    HttpServer(int port);
    ~HttpServer();
    void start();//启动HTTP服务器
    void stop();//停止HTTP服务器
    bool isRunning() const;//判断是否正在运行(常量函数)
    int getPort() const;//获取HTTP服务监听端口（常量函数）
    void get(const std::string& path, const httplib::Server::Handler& handler);//处理GET请求
    void post(const std::string& path, const httplib::Server::Handler& handler);//处理POST请求
    void setupMiddleware();//设置中间件
    void setupErrorHandler();//设置错误处理函数
private:
    httplib::Server m_server;//HTTP服务器实例
    int m_port;//HTTP服务监听端口
    bool m_running;//是否正在运行 
};


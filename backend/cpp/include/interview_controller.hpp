#pragma once
#include <string>
#include "../third_part/httplib.h"
#include "../third_part/json.hpp"
#include "InterviewService.hpp"

class InterviewController {
public:
    static void streamInterview(const httplib::Request& req, httplib::Response& res);//流式面试对话
    static void generateReport(const httplib::Request& req, httplib::Response& res);//生成报告
    static void getReport(const httplib::Request& req, httplib::Response& res);//获取报告
    static void listReports(const httplib::Request& req, httplib::Response& res);//列出所有报告
    static void createSession(const httplib::Request& req, httplib::Response& res);//创建会话
    static void sendMessage(const httplib::Request& req, httplib::Response& res);//发送消息
};
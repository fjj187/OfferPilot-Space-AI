#include "../include/interview_controller.hpp"

void InterviewController::streamInterview(const httplib::Request& req, httplib::Response& res)
{
    nlohmann::json body=nlohmann::json::parse(req.body);
    std::string sessionId=body["sessionId"].get<std::string>();
    std::string topic=body["topic"].get<std::string>();
    std::string message=body["message"].get<std::string>();
    res.set_header("Content-Type", "text/event-stream; charset=utf-8");//设置响应头
    res.set_header("Cache-Control","no-cache,no-transform");//设置缓存控制头
    res.set_header("Connection","keep-alive");//设置连接头
    std::string done="event: done\ndata:{}\n\n";//设置完成事件
    res.set_chunked_content_provider("text/event-stream", 
    [&](size_t offset, httplib::DataSink& sink) {
        // 在 sink 中写入 SSE 数据
        std::string data = "event: chunk\ndata: {...}\n\n";
        sink.write(data.c_str(), data.length());
        // 当所有数据写完，返回 false
        return true;  // 还有数据
    });
}

void InterviewController::generateReport(const httplib::Request& req, httplib::Response& res)
{
    nlohmann::json body=nlohmann::json::parse(req.body);
    std::string sessionId=body["sessionId"].get<std::string>();
    std::string topic=body["topic"].get<std::string>();
    std::string message=body["message"].get<std::string>();
    std::string source=body["source"].get<std::string>();
    res.set_content("Report generated", "text/plain");
}

void InterviewController::getReport(const httplib::Request& req, httplib::Response& res)
{
    nlohmann::json body=nlohmann::json::parse(req.body);
    std::string sessionId=body["sessionId"].get<std::string>();
    InterviewService interviewService;
    interviewService.getReport(sessionId);
    res.set_content("Report retrieved", "text/plain");
}

void InterviewController::listReports(const httplib::Request& req, httplib::Response& res)
{
    nlohmann::json body=nlohmann::json::parse(req.get_param_value("userId"));
    std::string userId=body["userId"].get<std::string>();
    InterviewService interviewService;
    nlohmann::json reports=nlohmann::json::array();
    interviewService.listReport(userId);
    res.set_content("Reports list", "text/plain");
}

void InterviewController::createSession(const httplib::Request& req, httplib::Response& res)
{
    nlohmann::json body=nlohmann::json::parse(req.body);
    std::string sessionId=body["sessionId"].get<std::string>();
    res.set_content("Session created", "text/plain");
}


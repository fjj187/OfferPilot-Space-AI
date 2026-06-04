#pragma once
#include <iostream>
#include <string>
#include "../include/ReportRepository.hpp"

class ReportCommandHandler {
public:
    ReportCommandHandler(ReportRepository& repository);//构造函数
    ~ReportCommandHandler();//析构函数

    std::string handleInsert(const std::string& jsonPayload);//处理插入命令
    std::string handleUpdate(const std::string& jsonPayload);//处理更新命令
    std::string handleGet(const std::string& jsonPayload);//处理获取命令
    std::string handleList(const std::string& jsonPayload);//处理列表命令
    std::string handleDelete(const std::string& jsonPayload);//处理删除命令

    ReportRepository& m_repository;

    InterviewReport parseReportFromJson(const std::string& jsonPayload);//解析 JSON 字符串为报告对象
    std::string reportToJson(const InterviewReport& report);//将报告对象转换为 JSON 字符串
    std::string reportsToJson(const std::vector<InterviewReport>& reports);//将报告列表转换为 JSON 字符串
    std::string successResponse(const std::string& data);//生成成功响应 JSON 字符串
    std::string errorResponse(const std::string& message);//生成错误响应 JSON 字符串    
};

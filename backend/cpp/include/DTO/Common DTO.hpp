#pragma once
#include <string>

struct ApiErrorDto{
    std::string code;//错误码
    std::string message;//错误信息
};

struct MessageDto{
    std::string role;//消息角色，取值为"user"或"assistant"
    std::string content;//消息内容
    std::string createdAt;//消息创建时间，ISO 8601格式
};

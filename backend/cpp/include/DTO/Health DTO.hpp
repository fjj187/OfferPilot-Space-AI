#pragma once
#include <string>

struct HealthResponseDto{
    bool ok;//服务健康状态，true表示正常，false表示异常
    std::string service;//服务名称
    std::string now;//当前时间，ISO 8601格式
};
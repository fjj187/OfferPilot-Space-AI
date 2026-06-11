#pragma once
#include <string>
#include "../third_part/httplib.h"
#include "../third_part/json.hpp"

class InterviewService
{
public:
    InterviewService();
    ~InterviewService();
    void getReport(const std::string& sessionId);
    void listReport(const std::string& userId);
};

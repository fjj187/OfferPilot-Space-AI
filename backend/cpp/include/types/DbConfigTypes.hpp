#pragma once
#include <string>

struct DbConfig {
    std::string host;
    unsigned short port = 3306;
    std::string database;
    std::string user;
    std::string password;
};
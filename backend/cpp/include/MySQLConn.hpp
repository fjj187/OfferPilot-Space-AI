#pragma once
#include <iostream>
#include <string>
#include <chrono>
#include <mysql.h>

class MySQLConn {
public:
    MySQLConn();
    ~MySQLConn();
    bool connect(std::string user, std::string passwd, std::string dbName, std::string ip, unsigned short port);
    bool update(const std::string& sql) const;
    bool query(const std::string& sql) const;
    bool next() const;
    std::string value(int index) const;
    bool transaction() const;
    bool commit() const;
    bool rollback() const;
    bool refreshAlivetime() const;
    long long getAlivetime() const;
    MYSQL* raw() const;
    bool isConnected() const;
private:
    MYSQL* conn = nullptr;
    std::chrono::time_point<std::chrono::system_clock> lastActiveTime;
    void freeResult() const;
    mutable MYSQL_RES* m_result = nullptr;
    mutable MYSQL_ROW m_row = nullptr;
    mutable std::chrono::steady_clock::time_point m_alivetime;
};

#pragma once
#include <iostream>
#include <string>
#include <chrono>
#include <mysql.h>

class MySQLConn {
public:
    MySQLConn();//初始化数据库连接对象
    ~MySQLConn();//销毁数据库连接对象
    bool connect(std::string user, std::string passwd, std::string dbName, std::string ip, unsigned short port);//连接数据库
    bool update(const std::string& sql);//更新数据库
    bool query(const std::string& sql);//查询数据库
    bool next();//遍历数据
    std::string value(int index);//获取当前行的第index列数据
    bool transaction();//开启事务
    bool commit();//提交事务
    bool rollback();//回滚事务
    bool refreshAlivetime();//刷新数据库连接时间
    long long getAlivetime();//获取数据库连接存活时间
private:
    MYSQL* conn = nullptr;//数据库连接对象指针
    std::chrono::time_point<std::chrono::system_clock> lastActiveTime;//上次活跃时间
    void freeResult();//释放查询结果
    MYSQL_RES* m_result = nullptr;//查询结果指针
    MYSQL_ROW m_row = nullptr;//当前行数据指针
    std::chrono::steady_clock::time_point m_alivetime;//数据库连接存活时间
};
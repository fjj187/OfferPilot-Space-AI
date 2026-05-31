#include "MySQLConn.hpp"

using namespace std;
using namespace chrono;

MySQLConn::MySQLConn()
{
    this->conn = mysql_init(nullptr);
    mysql_set_character_set(conn, "utf8");
}

MySQLConn::~MySQLConn()
{
    if (this->conn != nullptr)
    {
        mysql_close(this->conn);
    }
    freeResult();
}

bool MySQLConn::connect(string user, string passwd, string dbName, string ip, unsigned short port)
{
    this->user = user;
    this->passwd = passwd;
    this->dbName = dbName;
    this->ip = ip;
    this->port = port;
    MYSQL* ptr = mysql_real_connect(this->conn, ip.c_str(), user.c_str(), passwd.c_str(), dbName.c_str(), port, nullptr, 0);
    if (ptr == nullptr)
    {
        cout << "数据库连接失败: " << mysql_error(this->conn) << endl;
        return false;
    }
    return true;
}

bool MySQLConn::query(const string& sql)
{
    freeResult();
    if (mysql_query(this->conn, sql.c_str()))
    {
        cout << "数据库查询失败: " << mysql_error(this->conn) << endl;
        return false;
    }
    m_result = mysql_store_result(this->conn);
    return true;
}

bool MySQLConn::update(const string& sql)
{
    freeResult();
    if (mysql_query(this->conn, sql.c_str()))
    {
        cout << "数据库更新失败: " << mysql_error(this->conn) << endl;
        return false;
    }
    return true;
}

bool MySQLConn::next()
{
    if (m_result != nullptr)
    {
        m_row = mysql_fetch_row(m_result);
        return m_row != nullptr;
    }
    return false;
}

string MySQLConn::value(int index)
{
    int count = mysql_num_fields(m_result);
    if (index >= 0 && index < count)
    {
        char *val=m_row[index];
        unsigned long len=mysql_fetch_lengths(m_result)[index];
        if (m_row[index] == nullptr||val == nullptr) return "";
        return string(val, len);
    }
    return "";
}

bool MySQLConn::transaction()
{
    return mysql_autocommit(this->conn, false) ;
}

bool MySQLConn::commit()
{
    return mysql_commit(this->conn) ;
}

bool MySQLConn::rollback()
{
    return mysql_rollback(this->conn) ;
}

void MySQLConn::freeResult()
{
    if (m_result != nullptr)
    {
        mysql_free_result(m_result);
        m_result = nullptr;
    }
}

bool MySQLConn::refreshAlivetime()
{
    m_alivetime = steady_clock::now();
    return true;
}

long long MySQLConn::getAlivetime()
{
    auto now = steady_clock::now();
    auto duration = duration_cast<seconds>(now - m_alivetime);
    return duration.count();
}
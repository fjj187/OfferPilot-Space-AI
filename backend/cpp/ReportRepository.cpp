#include "ReportRepository.hpp"

ReportRepository::ReportRepository(MySQLConn* conn)
{
    this->m_conn = conn;
}
ReportRepository::~ReportRepository()
{
    if (this->m_conn != nullptr)
    {
        this->m_conn=nullptr;
    }
}

bool ReportRepository::insertReport(const InterviewReport& report)
{
    if(!this->m_conn->transaction()){
        std::cout << "数据库事务失败" << std::endl;
        return false;
    }//开启事务
    InterviewReport interview_report;
    m_conn->update(std::string sql);
}
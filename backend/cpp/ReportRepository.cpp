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
    std::string seesion_id=report.session_id;
    std::string id=report.id;
    std::string user_id=std::to_string(report.user_id);
    std::string topic=report.topic;
    std::string source=report.source;
    std::string source_document_id=report.source_document_id;
    std::string source_document_name=report.source_document_name;
    std::string question_title=report.question_title;
    std::string summary_headline=report.summary_headline;
    std::string summary_body=report.summary_body;
    std::string primary_weakness=report.primary_weakness;
    std::string answered_count=std::to_string(report.answered_count);
    std::string total_count=std::to_string(report.total_count);
    std::string created_at=report.created_at;
    std::string updated_at=report.updated_at;
    std::string sql="INSERT INTO interview_reports (report_id, session_id, user_id, topic, source, source_document_id, source_document_name, question_title, summary_headline, summary_body, primary_weakness, answered_count, total_count, created_at, updated_at) VALUES ('"+id+"', '"+seesion_id+"', "+user_id+", '"+topic+"', '"+source+"', '"+source_document_id+"', '"+source_document_name+"', '"+question_title+"', '"+summary_headline+"', '"+summary_body+"', '"+primary_weakness+"', "+answered_count+", "+total_count+", '"+created_at+"', '"+updated_at+"')";
    if(!m_conn->update(sql)){
        std::cout << "数据库更新失败" << std::endl;
        m_conn->rollback();
        return false;
    }
    if(insertWeaknessTags(report.id,report.weakness_tags)&&
       insertAnswerSnapshots(report.id,report.answer_snapshots)&&
       insertSuggestedFocus(report.id,report.suggested_focus)&&
       insertPracticePlans(report.id,report.practice_plans)){
        std::cout << "插入子表失败" << std::endl;
        m_conn->rollback();
        return false;
    }
    m_conn->commit();
    return true;
}

bool ReportRepository::updateReport(const InterviewReport& report)
{
    if(!this->m_conn->transaction()){
        std::cout << "数据库事务失败" << std::endl;
        return false;
    }//开启事务
    clearSubTables(report.id);
    std::string sql="UPDATE interview_reports SET session_id='"+report.session_id+"', user_id="+std::to_string(report.user_id)+", topic='"+report.topic+"', source='"+report.source+"', source_document_id='"+report.source_document_id+"', source_document_name='"+report.source_document_name+"', question_title='"+report.question_title+"', summary_headline='"+report.summary_headline+"', summary_body='"+report.summary_body+"', primary_weakness='"+report.primary_weakness+"', answered_count="+std::to_string(report.answered_count)+", total_count="+std::to_string(report.total_count)+", updated_at='"+report.updated_at+"' WHERE report_id='"+report.id+"'";
    if(!m_conn->update(sql)){
        std::cout << "数据库更新失败" << std::endl;
        m_conn->rollback();
        return false;
    }
    if(insertWeaknessTags(report.id,report.weakness_tags)||
       insertAnswerSnapshots(report.id,report.answer_snapshots)||
       insertSuggestedFocus(report.id,report.suggested_focus)||
       insertPracticePlans(report.id,report.practice_plans)){
        std::cout << "插入子表失败" << std::endl;
        m_conn->rollback();
        return false;
    }
    m_conn->commit();
    return true;
}

std::vector<InterviewReport> ReportRepository::getReportBySessionId(const std::string& sessionId){
    if(!m_conn->query("SELECT * FROM interview_reports WHERE session_id='"+sessionId+"'")){
        std::cout << "数据库查询失败" << std::endl;
        return {};
    }
    if(!m_conn->next()){
        std::cout << "数据库查询结果为空" << std::endl;
        return {};
    }
    InterviewReport report;
    report.id=m_conn->value(0);               // report_id
    report.session_id=m_conn->value(2);       // session_id
    report.user_id=stoi(m_conn->value(4));    // user_id
    report.topic=m_conn->value(5);            // topic
    report.source=m_conn->value(6);           // source
    report.source_document_id=m_conn->value(7);   // source_document_id
    report.source_document_name=m_conn->value(8); // source_document_name
    report.question_title=m_conn->value(9);   // question_title
    report.summary_headline=m_conn->value(10);// summary_headline
    report.summary_body=m_conn->value(11);    // summary_body
    report.primary_weakness=m_conn->value(12);// primary_weakness
    report.answered_count=stoi(m_conn->value(13)); // answered_count
    report.total_count=stoi(m_conn->value(14));    // total_count
    report.created_at=m_conn->value(15);      // created_at
    report.updated_at=m_conn->value(16);      // updated_at
    std::string report_id=m_conn->value(1);
    if(!m_conn->query("SELECT * FROM report_weakness_tags WHERE report_id='"+report_id+"'")){
        std::cout << "查询子表失败" << std::endl;
        return {};
    }
    while(m_conn->next()){
        report.weakness_tags.push_back(m_conn->value(2));
    }


    if(!m_conn->query("SELECT * FROM report_answer_snapshots WHERE report_id='"+report_id+"'")){
        std::cout << "查询子表失败" << std::endl;
        return {};
    }
    while(m_conn->next()){
        report.answer_snapshots.push_back(m_conn->value(3));
    }


    if(!m_conn->query("SELECT * FROM report_suggested_focus WHERE report_id='"+report_id+"'")){
        std::cout << "查询子表失败" << std::endl;
        return {};
    }
    while(m_conn->next()){
        report.suggested_focus.push_back(m_conn->value(2));
    }

    
    if(!m_conn->query("SELECT * FROM report_practice_plans WHERE report_id='"+report_id+"'")){
        std::cout << "查询子表失败" << std::endl;
        return {};
    }
    while(m_conn->next()){
        PracticePlan plan;
    plan.weakness_tag = m_conn->value(2);   
    plan.question_type = m_conn->value(3);  
    plan.difficulty = m_conn->value(4);     
    plan.zone = m_conn->value(5);           
    report.practice_plans.push_back(plan);
    }
    return {report};
}

bool ReportRepository::deleteReport(const std::string& sessionId)
{
    m_conn->query("select report_id from interview_reports where session_id='"+sessionId+"'");
    if(!m_conn->next()){
        std::cout << "数据库查询结果为空" << std::endl;
        return false;
    }
    std::string report_id=m_conn->value(1);
    m_conn->transaction();
    if(clearSubTables(report_id)){
        std::cout << "删除子表失败" << std::endl;
        m_conn->rollback();
    }
    std::string sql="DELETE FROM interview_reports WHERE report_id='"+report_id+"'";   
    if(!m_conn->update(sql)){
        std::cout << "数据库更新失败" << std::endl;
        m_conn->rollback();
        return false;
    }
    m_conn->commit();
    return true;
}
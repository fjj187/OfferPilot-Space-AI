#pragma once
#include <string>
#include <vector>
#include <../third_part/json.hpp>  
#include "../types/InterviewTypes.hpp"
#include <fstream>



class JsonSessionRepository{
public:
    JsonSessionRepository(const std::string& filePath);
    bool recordUserMessage(const InterviewStreamRequest& request);//记录用户消息
    bool recordAssistantMessage(const InterviewStreamRequest& request,const std::string& assistantContent);//记录助手消息
    std::vector<InterviewSessionSummary> listSessions();//返回所有会话摘要列表
    std::optional<InterviewSessionDetail> getSession(const std::string& sessionId,const std::string& threadId);//获取指定会话详情（含消息列表）
    std::vector<InterviewSessionDetail> listSessionsBySessionId(const std::string& sessionId);//按 sessionId 列出所有关联的会话详情（同一个 session 可能有多个 thread）
    void clearAll();//清空所有会话数据
    std::vector<InterviewSessionDetail> m_sessions;
    std::unordered_map<std::string, size_t> m_index;//键："sessionId:threadId" 拼接而成的字符串,值：该会话在 m_sessions 向量中的下标
    InterviewMessage latestUserMessage;//记录最新的用户消息（仅内容和时间戳，用于会话列表展示）
    InterviewMessage latestAssistantMessage;//记录最新的助手消息（仅内容和时间戳，用于会话列表展示）
    int messageCount=0;//记录消息总数（仅用于会话列表展示）
private:
    std::string buildKey(const std::string& sid, const std::string& tid);//构建唯一键
    InterviewSessionSummary toSummary(const InterviewSessionDetail&);//从详情构建摘要
    void ensureStorageDir();//确保存储目录存在
    void loadFromFile();//从文件加载数据到 m_sessions
    bool persistToFile();//将 m_sessions 中的数据持久化到文件
    std::string getCurrentTimestamp();//获取当前时间的 ISO 8601 字符串
    std::string m_filePath; 
};

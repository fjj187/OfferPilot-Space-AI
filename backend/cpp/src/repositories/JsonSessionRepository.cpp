#include "../include/repositories/JsonSessionRepository.hpp"

NLOHMANN_JSON_SERIALIZE_ENUM(InterviewMessageRole, {
    {InterviewMessageRole::User, "user"},
    {InterviewMessageRole::Assistant, "assistant"}
})

NLOHMANN_JSON_SERIALIZE_ENUM(InterviewFeedbackStyle, {
    {InterviewFeedbackStyle::Followup, "followup"},
    {InterviewFeedbackStyle::Corrective, "corrective"},
    {InterviewFeedbackStyle::Guided, "guided"}
})

inline void to_json(nlohmann::json&j,const InterviewFeedbackStyle){
    switch (j.get<InterviewFeedbackStyle>()) {
        case InterviewFeedbackStyle::Followup:
            j = "followup";
            break;
        case InterviewFeedbackStyle::Corrective:
            j = "corrective";
            break;
        case InterviewFeedbackStyle::Guided:
            j = "guided";
            break;
        default:
            j = nullptr; // 或者抛出异常
    }
}

inline void from_json(const nlohmann::json& j, std::optional<InterviewFeedbackStyle>& style) {
    if (j.is_null()) {
        style = std::nullopt;
        return;
    }
    std::string str = j.get<std::string>();
    if (str == "followup") style = InterviewFeedbackStyle::Followup;
    else if (str == "corrective") style = InterviewFeedbackStyle::Corrective;
    else if (str == "guided") style = InterviewFeedbackStyle::Guided;
    else style = std::nullopt; // 或者抛出异常
}

inline void to_json(nlohmann::json& j, const InterviewMessage& m) {
    j = nlohmann::json{
        {"role", m.role},
        {"content", m.content},
        {"createdAt", m.createdAt}
    };
}

inline void from_json(const nlohmann::json& j, InterviewMessage& m) {
    j.at("role").get_to(m.role);
    j.at("content").get_to(m.content);
    j.at("createdAt").get_to(m.createdAt);
}

inline void to_json(nlohmann::json& j, const InterviewSessionDetail& s) {
    j = nlohmann::json{
        {"sessionId", s.sessionId},
        {"threadId", s.threadId},
        {"topic", s.topic},
        {"questionTitle", s.questionTitle},
        {"feedbackStyle", s.feedbackStyle},
        {"createdAt", s.createdAt},
        {"updatedAt", s.updatedAt},
        {"messages", s.messages}
    };
}

inline void from_json(const nlohmann::json& j, InterviewSessionDetail& s) {
    j.at("sessionId").get_to(s.sessionId);
    j.at("threadId").get_to(s.threadId);
    j.at("topic").get_to(s.topic);
    j.at("questionTitle").get_to(s.questionTitle);
    // feedbackStyle 是 optional，nlohmann 原生支持
    if (j.contains("feedbackStyle")) j.at("feedbackStyle").get_to(s.feedbackStyle);
    j.at("createdAt").get_to(s.createdAt);
    j.at("updatedAt").get_to(s.updatedAt);
    j.at("messages").get_to(s.messages);
}

JsonSessionRepository::JsonSessionRepository(const std::string& filePath)
    : m_filePath(filePath) 
{
    ensureStorageDir();   // 确保文件所在目录存在
    loadFromFile();       // 从 JSON 文件加载已有数据到 m_sessions
    // 构建内存索引：键为 "sessionId:threadId"，值为在 m_sessions 中的下标
    for (size_t i = 0; i < m_sessions.size(); ++i) {
        const auto& session = m_sessions[i];
        std::string key = buildKey(session.sessionId, session.threadId);
        m_index[key] = i;
    }
}

bool JsonSessionRepository::recordUserMessage(const InterviewStreamRequest& request){
    InterviewMessage msg;
    msg.role = InterviewMessageRole::User;
    msg.content = request.answer;
    msg.createdAt = getCurrentTimestamp();
    std::string key = buildKey(request.sessionId, request.threadId);
    auto it=m_index.find(key);
    if(it!=m_index.end()){
        auto &session=m_sessions[it->second];
        session.topic=request.topic;
        session.questionTitle=request.questionTitle;
        session.messages.push_back(msg);
        if(request.options.feedbackStyle.has_value()){
            session.feedbackStyle=request.options.feedbackStyle;
        }
        session.updatedAt= getCurrentTimestamp();
    }
    else{
        InterviewSessionDetail newSession;
        newSession.sessionId=request.sessionId;
        newSession.threadId=request.threadId;
        newSession.topic=request.topic;
        newSession.questionTitle=request.questionTitle;
        if(request.options.feedbackStyle.has_value()){
            newSession.feedbackStyle=request.options.feedbackStyle;
        }
        newSession.createdAt= getCurrentTimestamp();
        newSession.updatedAt= getCurrentTimestamp();
        newSession.messages.push_back(msg);
        newSession.messageCount = 1;

        m_sessions.push_back(newSession);
        m_index[key]=m_sessions.size()-1;//更新索引
    }
    persistToFile();//每次记录后立即持久化到文件
    return true;
}

bool JsonSessionRepository::recordAssistantMessage(const InterviewStreamRequest& request,const std::string& assistantContent){
    InterviewMessage msg;
    msg.role = InterviewMessageRole::Assistant;
    msg.content = assistantContent;
    msg.createdAt = getCurrentTimestamp();
    std::string key = buildKey(request.sessionId, request.threadId);
    auto it=m_index.find(key);
    if(it!=m_index.end()){
        auto &session=m_sessions[it->second];
        session.messages.push_back(msg);
        session.updatedAt= getCurrentTimestamp();
    }
    else{
        return false;//未找到对应会话，记录失败
    }
    persistToFile();//每次记录后立即持久化到文件
    return true;
}

std::vector<InterviewSessionSummary> JsonSessionRepository::listSessions(){
    std::vector<InterviewSessionSummary> summaries;
    for(const auto& session : m_sessions){
        summaries.push_back(toSummary(session));
        for (const auto& msg : session.messages){
            if(msg.role==InterviewMessageRole::User){
                latestUserMessage=msg;
            }
            else if(msg.role==InterviewMessageRole::Assistant){
                latestAssistantMessage=msg;
            }
        }
    }
    messageCount = summaries.size();
    return summaries;
}

std::optional<InterviewSessionDetail> JsonSessionRepository::getSession(const std::string& sessionId,const std::string& threadId){
    std::string key = buildKey(sessionId, threadId);
    auto it=m_index.find(key);
    if(it!=m_index.end()){
        return m_sessions[it->second];
    }
    return std::nullopt;//未找到对应会话
}

std::vector<InterviewSessionDetail> JsonSessionRepository::listSessionsBySessionId(const std::string& sessionId){
    std::vector<InterviewSessionDetail> result;
    for(const auto& session : m_sessions){
        if(session.sessionId==sessionId){
            result.push_back(session);
        }
    }
    return result;
}

void JsonSessionRepository::clearAll(){
    m_sessions.clear();
    m_index.clear();
    persistToFile();//清空后立即持久化到文件
}

std::string JsonSessionRepository::buildKey(const std::string& sid, const std::string& tid){
    return sid + ":" + tid;
}

InterviewSessionSummary JsonSessionRepository::toSummary(const InterviewSessionDetail& detail){
    InterviewSessionSummary summary;
    summary.sessionId = detail.sessionId;
    summary.threadId = detail.threadId;
    summary.topic = detail.topic;
    summary.questionTitle = detail.questionTitle;
    summary.feedbackStyle = detail.feedbackStyle;
    summary.createdAt = detail.createdAt;
    summary.updatedAt = detail.updatedAt;
    summary.messageCount = detail.messages.size();
    for (const auto& msg : detail.messages){
        if(msg.role==InterviewMessageRole::User){
            summary.latestUserMessage=msg.content;
        }
        else if(msg.role==InterviewMessageRole::Assistant){
            summary.latestAssistantMessage=msg.content;
        }
    }
    return summary;
}

void JsonSessionRepository::ensureStorageDir(){
    std::filesystem::path path(m_filePath);
    auto dir = path.parent_path();
    if(!std::filesystem::exists(dir)){
        std::filesystem::create_directories(dir);
    }
}

void JsonSessionRepository::loadFromFile(){
    if(std::filesystem::exists(m_filePath)){
        std::ifstream inFile(m_filePath);
        if(inFile.is_open()){
            nlohmann::json j;
            inFile >> j;
            InterviewSessionDetail s;
            s.sessionId=j.value("sessionId", "");
            s.threadId=j.value("threadId", "");
            s.topic=j.value("topic", "");
            s.questionTitle=j.value("questionTitle", "");
            std::string styleStr = j.value("feedbackStyle", "");
            if (styleStr == "followup") {
                s.feedbackStyle = InterviewFeedbackStyle::Followup;
            } else if (styleStr == "corrective") {
                s.feedbackStyle = InterviewFeedbackStyle::Corrective;
            } else if (styleStr == "guided") {
                s.feedbackStyle = InterviewFeedbackStyle::Guided;
            } else {
                s.feedbackStyle = std::nullopt;   // 或者不赋值
            }
            s.createdAt=j.value("createdAt", "");
            s.updatedAt=j.value("updatedAt", "");
            if (j.contains("messages") && j["messages"].is_array()) {
                for (auto& msgJson : j["messages"]) {
                    InterviewMessage msg;
                    std::string roleStr = msgJson.value("role", "");
                    if (roleStr == "user") msg.role = InterviewMessageRole::User;
                    else if (roleStr == "assistant") msg.role = InterviewMessageRole::Assistant;
                    msg.content = msgJson.value("content", "");
                    msg.createdAt = msgJson.value("createdAt", "");
                    s.messages.push_back(msg);
                }
            }   
            m_sessions.push_back(s);
        }
    }
}

void JsonSessionRepository::persistToFile() {
    // 1. 构造根对象，不要直接盲写原始容器
    nlohmann::json root;
    root["sessions"] = m_sessions;   // 需要 m_sessions 的元素有 to_json 支持
    // 2. 临时文件路径
    std::string tmpPath = m_filePath + ".tmp";
    // 3. 写入临时文件
    {
        std::ofstream ofs(tmpPath, std::ios::out | std::ios::trunc);//覆盖写入
        if (!ofs.is_open()) {
            // 打开失败，保留原文件，直接返回
            return;
        }
        try {
            ofs << root.dump(2);  // 带缩进的 JSON
        } catch (const std::exception&) {
            // 序列化或写入异常，关闭文件流
            ofs.close();
            // 尝试删除可能已部分写入的临时文件
            std::filesystem::remove(tmpPath);
            return;
        }
        // 检查写入流状态
        if (ofs.fail()) {
            ofs.close();
            std::filesystem::remove(tmpPath);
            return;
        }
        // 确保数据刷新到磁盘
        ofs.close();
        if (ofs.fail()) {
            std::filesystem::remove(tmpPath);
            return;
        }
    }
    // 4. 原子替换正式文件
    try {
        std::filesystem::rename(tmpPath, m_filePath);
    } catch (const std::filesystem::filesystem_error&) {
        // 替换失败，尝试删除临时文件
        std::filesystem::remove(tmpPath);
        // 此时原文件未被改动，保持旧数据
    }
}

std::string JsonSessionRepository::getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::gmtime(&time_t);   // 或 localtime
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}
    
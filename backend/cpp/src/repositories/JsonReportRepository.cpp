#include "repositories/JsonReportRepository.hpp"

void to_json(nlohmann::json& j, const PracticePlanSnapshot& p) {
    j = nlohmann::json{
        {"weaknessTag", p.weaknessTag},
        {"questionType", p.questionType},
        {"difficulty", p.difficulty},
        {"zone", p.zone}
    };
}

void from_json(const nlohmann::json& j, PracticePlanSnapshot& p) {
    j.at("weaknessTag").get_to(p.weaknessTag);
    j.at("questionType").get_to(p.questionType);
    j.at("difficulty").get_to(p.difficulty);
    j.at("zone").get_to(p.zone);
}

void to_json(nlohmann::json& j, const InterviewReportEntity& r) {
    j = nlohmann::json{
        {"id", r.id},
        {"sessionId", r.sessionId},
        {"threadId", r.threadId ? nlohmann::json(*r.threadId) : nlohmann::json(nullptr)},
        {"topic", r.topic},
        {"source", r.source},
        {"sourceDocumentId", r.sourceDocumentId ? nlohmann::json(*r.sourceDocumentId) : nlohmann::json(nullptr)},
        {"sourceDocumentName", r.sourceDocumentName ? nlohmann::json(*r.sourceDocumentName) : nlohmann::json(nullptr)},
        {"questionTitle", r.questionTitle ? nlohmann::json(*r.questionTitle) : nlohmann::json(nullptr)},
        {"summaryHeadline", r.summaryHeadline},
        {"summaryBody", r.summaryBody},
        {"weaknessTags", r.weaknessTags},
        {"primaryWeakness", r.primaryWeakness ? nlohmann::json(*r.primaryWeakness) : nlohmann::json(nullptr)},
        {"weaknessFocusAreas", r.weaknessFocusAreas ? nlohmann::json(*r.weaknessFocusAreas) : nlohmann::json(nullptr)},
        {"answeredCount", r.answeredCount},
        {"totalCount", r.totalCount},
        {"answerSnapshot", r.answerSnapshot ? nlohmann::json(*r.answerSnapshot) : nlohmann::json(nullptr)},
        {"suggestedFocus", r.suggestedFocus ? nlohmann::json(*r.suggestedFocus) : nlohmann::json(nullptr)},
        {"practicePlan", r.practicePlan ? nlohmann::json(*r.practicePlan) : nlohmann::json(nullptr)},
        {"createdAt", r.createdAt},
        {"updatedAt", r.updatedAt}
    };
}

void from_json(const nlohmann::json& j, InterviewReportEntity& r) {
    j.at("id").get_to(r.id);
    j.at("sessionId").get_to(r.sessionId);
    if (j.contains("threadId") && !j.at("threadId").is_null()) {
        r.threadId = j.at("threadId").get<std::string>();
    }
    j.at("topic").get_to(r.topic);
    j.at("source").get_to(r.source);
    if (j.contains("sourceDocumentId") && !j.at("sourceDocumentId").is_null()) {
        r.sourceDocumentId = j.at("sourceDocumentId").get<std::string>();
    }
    if (j.contains("sourceDocumentName") && !j.at("sourceDocumentName").is_null()) {
        r.sourceDocumentName = j.at("sourceDocumentName").get<std::string>();
    }
    if (j.contains("questionTitle") && !j.at("questionTitle").is_null()) {
        r.questionTitle = j.at("questionTitle").get<std::string>();
    }
    j.at("summaryHeadline").get_to(r.summaryHeadline);
    j.at("summaryBody").get_to(r.summaryBody);
    if (j.contains("weaknessTags") && j.at("weaknessTags").is_array()) {
        r.weaknessTags = j.at("weaknessTags").get<std::vector<std::string>>();
    }
    if (j.contains("primaryWeakness") && !j.at("primaryWeakness").is_null()) {
        r.primaryWeakness = j.at("primaryWeakness").get<std::string>();
    }
    if (j.contains("weaknessFocusAreas") && !j.at("weaknessFocusAreas").is_null()) {
        r.weaknessFocusAreas = j.at("weaknessFocusAreas").get<std::vector<std::string>>();
    }
    j.at("answeredCount").get_to(r.answeredCount);
    j.at("totalCount").get_to(r.totalCount);
    if (j.contains("answerSnapshot") && !j.at("answerSnapshot").is_null()) {
        r.answerSnapshot = j.at("answerSnapshot").get<std::vector<std::string>>();
    }
    if (j.contains("suggestedFocus") && !j.at("suggestedFocus").is_null()) {
        r.suggestedFocus = j.at("suggestedFocus").get<std::vector<std::string>>();
    }
    if (j.contains("practicePlan") && !j.at("practicePlan").is_null()) {
        r.practicePlan = j.at("practicePlan").get<PracticePlanSnapshot>();
    }
    j.at("createdAt").get_to(r.createdAt);
    j.at("updatedAt").get_to(r.updatedAt);
}



JsonReportRepository::JsonReportRepository(const std::string& filePath)
:m_filePath(filePath)
{
    loadFromFile();
}


bool JsonReportRepository::upsertReport(const InterviewReportEntity& report){
    const auto key = buildKey(report.sessionId);
    auto it = m_index.find(key);

    if (it != m_index.end()) {
        m_reports[it->second] = report;
    } else {
        m_reports.push_back(report);
        m_index[key] = m_reports.size() - 1;
    }

    return persistToFile();
}

std::optional<InterviewReportEntity> JsonReportRepository::getReportBySessionId(const std::string& sessionId){
    auto it = m_index.find(buildKey(sessionId));
    if (it == m_index.end()) return std::nullopt;
    return m_reports[it->second];
}   

static InterviewReportSummary toSummary(const InterviewReportEntity& r) {
    InterviewReportSummary s;
    s.id = r.id;
    s.sessionId = r.sessionId;
    s.threadId = r.threadId;
    s.topic = r.topic;
    s.questionTitle = r.questionTitle;
    s.summaryHeadline = r.summaryHeadline;
    s.answeredCount = r.answeredCount;
    s.totalCount = r.totalCount;
    s.weaknessTags = r.weaknessTags;
    s.createdAt = r.createdAt;
    s.updatedAt = r.updatedAt;
    return s;
}

std::vector<InterviewReportSummary> JsonReportRepository::listReports(){
    std::vector<InterviewReportSummary> result;
    for (const auto& report : m_reports) {
        result.push_back(toSummary(report));
    }
    return result;
}

bool JsonReportRepository::removeBySessionId(const std::string& sessionId){
    const auto key = buildKey(sessionId);
    auto it = m_index.find(key);
    if (it == m_index.end()) return false;

    m_reports.erase(m_reports.begin() + static_cast<std::ptrdiff_t>(it->second));//ptrdiff_t 是 C 和 C++ 标准库中定义的一种有符号整数类型，专门用来存放两个指针相减的结果

    m_index.clear();
    for (size_t i = 0; i < m_reports.size(); ++i) {
        m_index[buildKey(m_reports[i].sessionId)] = i;
    }

    return persistToFile();
}

void JsonReportRepository::clearAll(){
    m_reports.clear();
    m_index.clear();
    persistToFile();
}

std::string JsonReportRepository::buildKey(const std::string& sessionId) const {
    return sessionId;
}

void JsonReportRepository::loadFromFile() {
    m_reports.clear();
    m_index.clear();

    if (!std::filesystem::exists(m_filePath)) return;

    std::ifstream in(m_filePath);
    if (!in.is_open()) return;

    nlohmann::json root;
    try {
        in >> root;
    } catch (...) {
        return;
    }

    if (!root.contains("reports") || !root["reports"].is_array()) return;

    for (const auto& item : root["reports"]) {
        m_reports.push_back(item.get<InterviewReportEntity>());
    }

    for (size_t i = 0; i < m_reports.size(); ++i) {
        m_index[buildKey(m_reports[i].sessionId)] = i;
    }
}

bool JsonReportRepository::persistToFile() {
    std::filesystem::path path(m_filePath);
    auto dir = path.parent_path();
    if (!std::filesystem::exists(dir)) {
        std::filesystem::create_directories(dir);
    }

    nlohmann::json root;
    root["reports"] = m_reports;

    const std::string tmpPath = m_filePath + ".tmp";
    {
        std::ofstream out(tmpPath, std::ios::trunc);
        if (!out.is_open()) return false;
        out << root.dump(2);
        if (out.fail()) return false;
    }

    std::filesystem::remove(m_filePath);
    std::filesystem::rename(tmpPath, m_filePath);
    return true;
}

std::string JsonReportRepository::nowIsoUtc() const {
    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::gmtime(&tt);

    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

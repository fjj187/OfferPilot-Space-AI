#include "repositories/MySQLReportRepository.hpp"

namespace {
std::string escapeSql(MySQLConn& conn, const std::string& input) {
    std::string escaped;
    escaped.resize(input.size() * 2 + 1);

    const unsigned long len = mysql_real_escape_string(
        conn.raw(),
        escaped.data(),
        input.c_str(),
        static_cast<unsigned long>(input.size())
    );

    escaped.resize(len);
    return escaped;
}

std::string isoUtcToMysqlDatetime(const std::string& isoUtc) {
    std::string out = isoUtc;
    if (!out.empty() && out.back() == 'Z') {
        out.pop_back();
    }
    for (char& ch : out) {
        if (ch == 'T') {
            ch = ' ';
            break;
        }
    }
    return out;
}

std::string mysqlDatetimeToIsoUtc(const std::string& mysqlDatetime) {
    std::string out = mysqlDatetime;
    for (char& ch : out) {
        if (ch == ' ') {
            ch = 'T';
            break;
        }
    }
    return out + "Z";
}

std::string jsonOrNull(const std::optional<std::string>& value) {
    return value.has_value() ? *value : "";
}//接受一个std::optional<std::string>类型的参数value，如果value有值，则返回其内容，否则返回一个空字符串。

std::optional<std::string> nullIfEmpty(const std::string& value) {
    if (value.empty()) {
        return std::nullopt;
    }
    return value;
}//接受一个std::string类型的参数value，如果value为空字符串，则返回std::nullopt，否则返回value的内容。

std::string vecToJson(const std::vector<std::string>& value) {
    nlohmann::json j = value;
    return j.dump();
}//接受一个std::vector<std::string>类型的参数value，将其转换为JSON格式的字符串并返回。

std::optional<std::vector<std::string>> jsonToStringVec(const std::string& raw) {
    if (raw.empty()) {
        return std::nullopt;
    }
    try {
        auto j = nlohmann::json::parse(raw);
        if (!j.is_array()) {
            return std::nullopt;
        }
        return j.get<std::vector<std::string>>();
    } catch (...) {
        return std::nullopt;
    }
}//接受一个std::string类型的参数raw，如果raw为空字符串，则返回std::nullopt。否则尝试将raw解析为JSON格式，并检查其是否为数组。如果是数组，则将其转换为std::vector<std::string>并返回，否则返回std::nullopt。如果解析过程中发生异常，也返回std::nullopt。

std::optional<PracticePlanSnapshot> jsonToPracticePlan(const std::string& raw) {
    if (raw.empty()) {
        return std::nullopt;
    }
    try {
        auto j = nlohmann::json::parse(raw);
        PracticePlanSnapshot p;
        p.weaknessTag = j.value("weaknessTag", "");
        p.questionType = j.value("questionType", "");
        p.difficulty = j.value("difficulty", "");
        p.zone = j.value("zone", "");
        return p;
    } catch (...) {
        return std::nullopt;
    }
}//接受一个std::string类型的参数raw，如果raw为空字符串，则返回std::nullopt。否则尝试将raw解析为JSON格式，并从中提取"weaknessTag"、"questionType"、"difficulty"和"zone"字段的值，创建一个PracticePlanSnapshot对象并返回。如果解析过程中发生异常，也返回std::nullopt。

std::string practicePlanToJson(const std::optional<PracticePlanSnapshot>& plan) {
    if (!plan.has_value()) {
        return "null";
    }
    nlohmann::json j = {
        {"weaknessTag", plan->weaknessTag},
        {"questionType", plan->questionType},
        {"difficulty", plan->difficulty},
        {"zone", plan->zone}
    };
    return j.dump();
}//接受一个std::optional<PracticePlanSnapshot>类型的参数plan，如果plan没有值，则返回字符串"null"。否则，将plan中的字段转换为JSON格式的字符串并返回。

std::string reviewsToJson(const std::optional<std::vector<ReportQuestionReview>>& reviews) {
    if (!reviews.has_value()) {
        return "null";
    }

    nlohmann::json arr = nlohmann::json::array();
    for (const auto& review : *reviews) {
        arr.push_back({
            {"questionId", review.questionId},
            {"questionTitle", review.questionTitle},
            {"userAnswer", review.userAnswer},
            {"referenceAnswer", review.referenceAnswer ? nlohmann::json(*review.referenceAnswer) : nlohmann::json(nullptr)},
            {"aiFeedback", review.aiFeedback ? nlohmann::json(*review.aiFeedback) : nlohmann::json(nullptr)}
        });
    }
    return arr.dump();
}//接受一个std::optional<std::vector<ReportQuestionReview>>类型的参数reviews，如果reviews没有值，则返回字符串"null"。否则，将reviews中的每个ReportQuestionReview对象转换为JSON格式，并将其放入一个JSON数组中，最后返回该数组的字符串表示。

std::optional<std::vector<ReportQuestionReview>> jsonToReviews(const std::string& raw) {
    if (raw.empty()) {
        return std::nullopt;
    }

    try {
        auto j = nlohmann::json::parse(raw);
        if (!j.is_array()) {
            return std::nullopt;
        }

        std::vector<ReportQuestionReview> reviews;
        for (const auto& item : j) {
            if (!item.is_object()) continue;
            ReportQuestionReview review;
            review.questionId = item.value("questionId", "");
            review.questionTitle = item.value("questionTitle", "");
            review.userAnswer = item.value("userAnswer", "");
            if (item.contains("referenceAnswer") && !item["referenceAnswer"].is_null()) {
                review.referenceAnswer = item["referenceAnswer"].get<std::string>();
            }
            if (item.contains("aiFeedback") && !item["aiFeedback"].is_null()) {
                review.aiFeedback = item["aiFeedback"].get<std::string>();
            }
            reviews.push_back(std::move(review));
        }
        return reviews;
    } catch (...) {
        return std::nullopt;
    }
}//接受一个std::string类型的参数raw，如果raw为空字符串，则返回std::nullopt。否则尝试将raw解析为JSON格式，并检查其是否为数组。如果是数组，则遍历数组中的每个元素，将其转换为ReportQuestionReview对象，并将这些对象放入一个std::vector中，最后返回该向量。如果解析过程中发生异常，也返回std::nullopt。
}

MySQLReportRepository::MySQLReportRepository(MySQLConn& conn)
    : m_conn(conn) {}

InterviewReportSummary MySQLReportRepository::toSummary(const InterviewReportEntity& report) const {
    InterviewReportSummary summary;
    summary.id = report.id;
    summary.sessionId = report.sessionId;
    summary.threadId = report.threadId;
    summary.topic = report.topic;
    summary.questionTitle = report.questionTitle;
    summary.summaryHeadline = report.summaryHeadline;
    summary.answeredCount = report.answeredCount;
    summary.totalCount = report.totalCount;
    summary.weaknessTags = report.weaknessTags;
    summary.createdAt = report.createdAt;
    summary.updatedAt = report.updatedAt;
    return summary;
}

bool MySQLReportRepository::upsertReport(const InterviewReportEntity& report) {
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto existing = getReportBySessionId(report.sessionId);

    const auto escapedId = escapeSql(m_conn, report.id);
    const auto escapedSessionId = escapeSql(m_conn, report.sessionId);
    const auto escapedTopic = escapeSql(m_conn, report.topic);
    const auto escapedSource = escapeSql(m_conn, report.source);
    const auto escapedSummaryHeadline = escapeSql(m_conn, report.summaryHeadline);
    const auto escapedSummaryBody = escapeSql(m_conn, report.summaryBody);

    const auto escapedModelId = report.modelId ? escapeSql(m_conn, *report.modelId) : "";
    const auto escapedThreadId = report.threadId ? escapeSql(m_conn, *report.threadId) : "";
    const auto escapedSourceDocumentId = report.sourceDocumentId ? escapeSql(m_conn, *report.sourceDocumentId) : "";
    const auto escapedSourceDocumentName = report.sourceDocumentName ? escapeSql(m_conn, *report.sourceDocumentName) : "";
    const auto escapedSourceDocumentExcerpt = report.sourceDocumentExcerpt ? escapeSql(m_conn, *report.sourceDocumentExcerpt) : "";
    const auto escapedQuestionTitle = report.questionTitle ? escapeSql(m_conn, *report.questionTitle) : "";
    const auto escapedPrimaryWeakness = report.primaryWeakness ? escapeSql(m_conn, *report.primaryWeakness) : "";

    const auto weaknessTagsJson = escapeSql(m_conn, vecToJson(report.weaknessTags));
    const auto weaknessFocusAreasJson = escapeSql(m_conn, report.weaknessFocusAreas ? vecToJson(*report.weaknessFocusAreas) : "null");
    const auto answerSnapshotJson = escapeSql(m_conn, report.answerSnapshot ? vecToJson(*report.answerSnapshot) : "null");
    const auto questionReviewsJson = escapeSql(m_conn, reviewsToJson(report.questionReviews));
    const auto suggestedFocusJson = escapeSql(m_conn, report.suggestedFocus ? vecToJson(*report.suggestedFocus) : "null");
    const auto practicePlanJson = escapeSql(m_conn, practicePlanToJson(report.practicePlan));

    std::ostringstream sql;
    if (existing.has_value()) {
        sql << "UPDATE interview_reports SET "
            << "report_id = '" << escapedId << "', "
            << "thread_id = " << (report.threadId ? "'" + escapedThreadId + "'" : "NULL") << ", "
            << "topic = '" << escapedTopic << "', "
            << "source = '" << escapedSource << "', "
            << "model_id = " << (report.modelId ? "'" + escapedModelId + "'" : "NULL") << ", "
            << "source_document_id = " << (report.sourceDocumentId ? "'" + escapedSourceDocumentId + "'" : "NULL") << ", "
            << "source_document_name = " << (report.sourceDocumentName ? "'" + escapedSourceDocumentName + "'" : "NULL") << ", "
            << "source_document_excerpt = " << (report.sourceDocumentExcerpt ? "'" + escapedSourceDocumentExcerpt + "'" : "NULL") << ", "
            << "question_title = " << (report.questionTitle ? "'" + escapedQuestionTitle + "'" : "NULL") << ", "
            << "summary_headline = '" << escapedSummaryHeadline << "', "
            << "summary_body = '" << escapedSummaryBody << "', "
            << "weakness_tags = '" << weaknessTagsJson << "', "
            << "primary_weakness = " << (report.primaryWeakness ? "'" + escapedPrimaryWeakness + "'" : "NULL") << ", "
            << "weakness_focus_areas = " << (report.weaknessFocusAreas ? "'" + weaknessFocusAreasJson + "'" : "NULL") << ", "
            << "answered_count = " << report.answeredCount << ", "
            << "total_count = " << report.totalCount << ", "
            << "answer_snapshot = " << (report.answerSnapshot ? "'" + answerSnapshotJson + "'" : "NULL") << ", "
            << "question_reviews = " << (report.questionReviews ? "'" + questionReviewsJson + "'" : "NULL") << ", "
            << "suggested_focus = " << (report.suggestedFocus ? "'" + suggestedFocusJson + "'" : "NULL") << ", "
            << "practice_plan = " << (report.practicePlan ? "'" + practicePlanJson + "'" : "NULL") << ", "
            << "updated_at = UTC_TIMESTAMP() "
            << "WHERE session_id = '" << escapedSessionId << "'";
    } else {
        sql << "INSERT INTO interview_reports ("
            << "report_id, session_id, thread_id, topic, source, model_id, source_document_id, source_document_name, "
            << "source_document_excerpt, question_title, summary_headline, summary_body, weakness_tags, primary_weakness, "
            << "weakness_focus_areas, answered_count, total_count, answer_snapshot, question_reviews, suggested_focus, "
            << "practice_plan, created_at, updated_at"
            << ") VALUES ("
            << "'" << escapedId << "', "
            << "'" << escapedSessionId << "', "
            << (report.threadId ? "'" + escapedThreadId + "'" : "NULL") << ", "
            << "'" << escapedTopic << "', "
            << "'" << escapedSource << "', "
            << (report.modelId ? "'" + escapedModelId + "'" : "NULL") << ", "
            << (report.sourceDocumentId ? "'" + escapedSourceDocumentId + "'" : "NULL") << ", "
            << (report.sourceDocumentName ? "'" + escapedSourceDocumentName + "'" : "NULL") << ", "
            << (report.sourceDocumentExcerpt ? "'" + escapedSourceDocumentExcerpt + "'" : "NULL") << ", "
            << (report.questionTitle ? "'" + escapedQuestionTitle + "'" : "NULL") << ", "
            << "'" << escapedSummaryHeadline << "', "
            << "'" << escapedSummaryBody << "', "
            << "'" << weaknessTagsJson << "', "
            << (report.primaryWeakness ? "'" + escapedPrimaryWeakness + "'" : "NULL") << ", "
            << (report.weaknessFocusAreas ? "'" + weaknessFocusAreasJson + "'" : "NULL") << ", "
            << report.answeredCount << ", "
            << report.totalCount << ", "
            << (report.answerSnapshot ? "'" + answerSnapshotJson + "'" : "NULL") << ", "
            << (report.questionReviews ? "'" + questionReviewsJson + "'" : "NULL") << ", "
            << (report.suggestedFocus ? "'" + suggestedFocusJson + "'" : "NULL") << ", "
            << (report.practicePlan ? "'" + practicePlanJson + "'" : "NULL") << ", "
            << "UTC_TIMESTAMP(), "
            << "UTC_TIMESTAMP()"
            << ")";
    }

    return m_conn.update(sql.str());
}

std::optional<InterviewReportEntity> MySQLReportRepository::getReportBySessionId(const std::string& sessionId) {
    if (!m_conn.isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(m_conn, sessionId);

    std::ostringstream sql;
    sql << "SELECT "
        << "report_id, session_id, model_id, thread_id, topic, source, source_document_id, source_document_name, "
        << "source_document_excerpt, question_title, summary_headline, summary_body, weakness_tags, primary_weakness, "
        << "weakness_focus_areas, answered_count, total_count, answer_snapshot, question_reviews, suggested_focus, "
        << "practice_plan, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at, "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updated_at "
        << "FROM interview_reports "
        << "WHERE session_id = '" << escapedSessionId << "' "
        << "LIMIT 1";

    if (!m_conn.query(sql.str())) {
        return std::nullopt;
    }

    if (!m_conn.next()) {
        return std::nullopt;
    }

    InterviewReportEntity report;
    report.id = m_conn.value(0);
    report.sessionId = m_conn.value(1);
    report.modelId = nullIfEmpty(m_conn.value(2));
    report.threadId = nullIfEmpty(m_conn.value(3));
    report.topic = m_conn.value(4);
    report.source = m_conn.value(5);
    report.sourceDocumentId = nullIfEmpty(m_conn.value(6));
    report.sourceDocumentName = nullIfEmpty(m_conn.value(7));
    report.sourceDocumentExcerpt = nullIfEmpty(m_conn.value(8));
    report.questionTitle = nullIfEmpty(m_conn.value(9));
    report.summaryHeadline = m_conn.value(10);
    report.summaryBody = m_conn.value(11);
    report.weaknessTags = jsonToStringVec(m_conn.value(12)).value_or(std::vector<std::string>{});
    report.primaryWeakness = nullIfEmpty(m_conn.value(13));
    report.weaknessFocusAreas = jsonToStringVec(m_conn.value(14));
    report.answeredCount = std::stoi(m_conn.value(15));
    report.totalCount = std::stoi(m_conn.value(16));
    report.answerSnapshot = jsonToStringVec(m_conn.value(17));
    report.questionReviews = jsonToReviews(m_conn.value(18));
    report.suggestedFocus = jsonToStringVec(m_conn.value(19));
    report.practicePlan = jsonToPracticePlan(m_conn.value(20));
    report.createdAt = m_conn.value(21);
    report.updatedAt = m_conn.value(22);

    return report;
}

std::vector<InterviewReportSummary> MySQLReportRepository::listReports() {
    std::vector<InterviewReportSummary> result;

    if (!m_conn.isConnected()) {
        return result;
    }

    std::ostringstream sql;
    sql << "SELECT "
        << "report_id, session_id, thread_id, topic, question_title, summary_headline, "
        << "answered_count, total_count, weakness_tags, "
        << "DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at, "
        << "DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updated_at "
        << "FROM interview_reports "
        << "ORDER BY updated_at DESC";

    if (!m_conn.query(sql.str())) {
        return result;
    }

    while (m_conn.next()) {
        InterviewReportSummary summary;
        summary.id = m_conn.value(0);
        summary.sessionId = m_conn.value(1);
        summary.threadId = nullIfEmpty(m_conn.value(2));
        summary.topic = m_conn.value(3);
        summary.questionTitle = nullIfEmpty(m_conn.value(4));
        summary.summaryHeadline = m_conn.value(5);
        summary.answeredCount = std::stoi(m_conn.value(6));
        summary.totalCount = std::stoi(m_conn.value(7));
        summary.weaknessTags = jsonToStringVec(m_conn.value(8)).value_or(std::vector<std::string>{});
        summary.createdAt = m_conn.value(9);
        summary.updatedAt = m_conn.value(10);

        result.push_back(std::move(summary));
    }

    return result;
}

bool MySQLReportRepository::removeBySessionId(const std::string& sessionId) {
    if (!m_conn.isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(m_conn, sessionId);

    std::ostringstream sql;
    sql << "DELETE FROM interview_reports "
        << "WHERE session_id = '" << escapedSessionId << "'";

    return m_conn.update(sql.str());
}

void MySQLReportRepository::clearAll() {
    if (!m_conn.isConnected()) {
        return;
    }

    m_conn.update("DELETE FROM interview_reports");
}
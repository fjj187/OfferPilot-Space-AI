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

std::optional<std::string> nullIfEmpty(const std::string& value) {
    if (value.empty()) {
        return std::nullopt;
    }
    return value;
}

std::string vecToJson(const std::vector<std::string>& value) {
    nlohmann::json j = value;
    return j.dump();
}

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
}

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
}

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
}

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
}

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
}
}

MySQLReportRepository::MySQLReportRepository(MySQLConnectionPool& pool)
    : m_pool(pool) {}

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
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedId = escapeSql(*conn, report.id);
    const auto escapedSessionId = escapeSql(*conn, report.sessionId);
    const auto escapedTopic = escapeSql(*conn, report.topic);
    const auto escapedSource = escapeSql(*conn, report.source);
    const auto escapedSummaryHeadline = escapeSql(*conn, report.summaryHeadline);
    const auto escapedSummaryBody = escapeSql(*conn, report.summaryBody);

    const auto escapedModelId = report.modelId ? escapeSql(*conn, *report.modelId) : "";
    const auto escapedThreadId = report.threadId ? escapeSql(*conn, *report.threadId) : "";
    const auto escapedSourceDocumentId = report.sourceDocumentId ? escapeSql(*conn, *report.sourceDocumentId) : "";
    const auto escapedSourceDocumentName = report.sourceDocumentName ? escapeSql(*conn, *report.sourceDocumentName) : "";
    const auto escapedSourceDocumentExcerpt = report.sourceDocumentExcerpt ? escapeSql(*conn, *report.sourceDocumentExcerpt) : "";
    const auto escapedQuestionTitle = report.questionTitle ? escapeSql(*conn, *report.questionTitle) : "";
    const auto escapedPrimaryWeakness = report.primaryWeakness ? escapeSql(*conn, *report.primaryWeakness) : "";

    const auto weaknessTagsJson = escapeSql(*conn, vecToJson(report.weaknessTags));
    const auto weaknessFocusAreasJson = escapeSql(*conn, report.weaknessFocusAreas ? vecToJson(*report.weaknessFocusAreas) : "null");
    const auto answerSnapshotJson = escapeSql(*conn, report.answerSnapshot ? vecToJson(*report.answerSnapshot) : "null");
    const auto questionReviewsJson = escapeSql(*conn, reviewsToJson(report.questionReviews));
    const auto suggestedFocusJson = escapeSql(*conn, report.suggestedFocus ? vecToJson(*report.suggestedFocus) : "null");
    const auto practicePlanJson = escapeSql(*conn, practicePlanToJson(report.practicePlan));

    std::ostringstream sql;
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
        << ") "
        << "ON DUPLICATE KEY UPDATE "
        << "report_id = VALUES(report_id), "
        << "thread_id = VALUES(thread_id), "
        << "topic = VALUES(topic), "
        << "source = VALUES(source), "
        << "model_id = VALUES(model_id), "
        << "source_document_id = VALUES(source_document_id), "
        << "source_document_name = VALUES(source_document_name), "
        << "source_document_excerpt = VALUES(source_document_excerpt), "
        << "question_title = VALUES(question_title), "
        << "summary_headline = VALUES(summary_headline), "
        << "summary_body = VALUES(summary_body), "
        << "weakness_tags = VALUES(weakness_tags), "
        << "primary_weakness = VALUES(primary_weakness), "
        << "weakness_focus_areas = VALUES(weakness_focus_areas), "
        << "answered_count = VALUES(answered_count), "
        << "total_count = VALUES(total_count), "
        << "answer_snapshot = VALUES(answer_snapshot), "
        << "question_reviews = VALUES(question_reviews), "
        << "suggested_focus = VALUES(suggested_focus), "
        << "practice_plan = VALUES(practice_plan), "
        << "updated_at = UTC_TIMESTAMP()";

    return conn->update(sql.str());
}

std::optional<InterviewReportEntity> MySQLReportRepository::getReportBySessionId(const std::string& sessionId) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return std::nullopt;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);

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

    if (!conn->query(sql.str())) {
        return std::nullopt;
    }

    if (!conn->next()) {
        return std::nullopt;
    }

    InterviewReportEntity report;
    report.id = conn->value(0);
    report.sessionId = conn->value(1);
    report.modelId = nullIfEmpty(conn->value(2));
    report.threadId = nullIfEmpty(conn->value(3));
    report.topic = conn->value(4);
    report.source = conn->value(5);
    report.sourceDocumentId = nullIfEmpty(conn->value(6));
    report.sourceDocumentName = nullIfEmpty(conn->value(7));
    report.sourceDocumentExcerpt = nullIfEmpty(conn->value(8));
    report.questionTitle = nullIfEmpty(conn->value(9));
    report.summaryHeadline = conn->value(10);
    report.summaryBody = conn->value(11);
    report.weaknessTags = jsonToStringVec(conn->value(12)).value_or(std::vector<std::string>{});
    report.primaryWeakness = nullIfEmpty(conn->value(13));
    report.weaknessFocusAreas = jsonToStringVec(conn->value(14));
    report.answeredCount = std::stoi(conn->value(15));
    report.totalCount = std::stoi(conn->value(16));
    report.answerSnapshot = jsonToStringVec(conn->value(17));
    report.questionReviews = jsonToReviews(conn->value(18));
    report.suggestedFocus = jsonToStringVec(conn->value(19));
    report.practicePlan = jsonToPracticePlan(conn->value(20));
    report.createdAt = conn->value(21);
    report.updatedAt = conn->value(22);

    return report;
}

std::vector<InterviewReportSummary> MySQLReportRepository::listReports() {
    std::vector<InterviewReportSummary> result;

    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
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

    if (!conn->query(sql.str())) {
        return result;
    }

    while (conn->next()) {
        InterviewReportSummary summary;
        summary.id = conn->value(0);
        summary.sessionId = conn->value(1);
        summary.threadId = nullIfEmpty(conn->value(2));
        summary.topic = conn->value(3);
        summary.questionTitle = nullIfEmpty(conn->value(4));
        summary.summaryHeadline = conn->value(5);
        summary.answeredCount = std::stoi(conn->value(6));
        summary.totalCount = std::stoi(conn->value(7));
        summary.weaknessTags = jsonToStringVec(conn->value(8)).value_or(std::vector<std::string>{});
        summary.createdAt = conn->value(9);
        summary.updatedAt = conn->value(10);

        result.push_back(std::move(summary));
    }

    return result;
}

bool MySQLReportRepository::removeBySessionId(const std::string& sessionId) {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return false;
    }

    const auto escapedSessionId = escapeSql(*conn, sessionId);

    std::ostringstream sql;
    sql << "DELETE FROM interview_reports "
        << "WHERE session_id = '" << escapedSessionId << "'";

    return conn->update(sql.str());
}

void MySQLReportRepository::clearAll() {
    auto conn = m_pool.acquire();
    if (!conn || !conn->isConnected()) {
        return;
    }

    conn->update("DELETE FROM interview_reports");
}

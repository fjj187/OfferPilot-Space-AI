#pragma once
#include <optional>
#include <string>
#include "MySQLConn.hpp"
#include "types/InterviewTypes.hpp"
#include <sstream>
#include <iomanip>
#include <ctime>

#include "json.hpp"


struct InterviewStreamCheckpointRecord {
    std::string sessionId;
    std::string threadId;
    std::string messageId;
    std::string idempotentKey;
    std::optional<long long> userId;
    std::string status;
    std::string content;
    int lastSequence = 0;
    std::string createdAt;
    std::string updatedAt;
    std::optional<std::string> completedAt;
    std::optional<std::string> errorCode;
    std::optional<std::string> errorMessage;
};

class MySQLStreamCheckpointRepository {
public:
    explicit MySQLStreamCheckpointRepository(MySQLConn& conn);

    std::optional<InterviewStreamCheckpointRecord> getByKey(
        const std::string& sessionId,
        const std::string& threadId,
        const std::string& idempotentKey) const;

    std::optional<InterviewStreamCheckpointRecord> getLatestBySessionThread(
        const std::string& sessionId,
        const std::string& threadId) const;

    bool upsertStart(const InterviewStreamCheckpointRecord& checkpoint);
    bool appendChunk(const std::string& sessionId,
                     const std::string& threadId,
                     const std::string& idempotentKey,
                     const std::string& chunk);

    bool complete(const std::string& sessionId,
                  const std::string& threadId,
                  const std::string& idempotentKey);

    bool fail(const std::string& sessionId,
              const std::string& threadId,
              const std::string& idempotentKey,
              const std::string& code,
              const std::string& message,
              const std::string& status);

private:
    MySQLConn& m_conn;
};
#include <windows.h>
#include <memory>
#include <cstdlib>

#include "app_config.hpp"
#include "http_server.hpp"
#include "providers/MockInterviewProviders.hpp"
#include "providers/OpenAIInterviewProvider.hpp"
#include "Client/OpenAIReportAiClient.hpp"
#include "repositories/JsonSessionRepository.hpp"
#include "repositories/JsonReportRepository.hpp"
#include "services/InterviewService.hpp"
#include "services/ReportService.hpp"
#include "interview_controller.hpp"
#include "InterviewRoutes.hpp"

static std::string envOr(const char* key, const std::string& fallback = "") {
    const char* value = std::getenv(key);
    return value ? std::string(value) : fallback;
}

int main() {
    SetConsoleOutputCP(65001);
    SetConsoleCP(65001);

    AppConfig& config = AppConfig::loadFromEnv();
    if (!config.isConfigValid()) {
        return 1;
    }

    HttpServer httpServer(config.httpPort);
    httpServer.setupMiddleware();
    httpServer.setupErrorHandler();

    httpServer.get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(R"({"success":true,"message":"ok"})", "application/json");
    });

    JsonSessionRepository sessionRepo("data/interview_sessions.json");
    JsonReportRepository reportRepo("data/interview_reports.json");

    std::unique_ptr<InterviewProvider> interviewProvider;
    const bool useMock = envOr("USE_MOCK_INTERVIEW_PROVIDER") == "1";

    if (useMock) {
        interviewProvider = std::make_unique<MockInterviewProvider>();
    } else {
        interviewProvider = std::make_unique<OpenAIInterviewProvider>(
            envOr("OPENAI_API_KEY"),
            envOr("OPENAI_BASE_URL", "https://api.openai.com"),
            envOr("OPENAI_INTERVIEW_MODEL", "gpt-4o-mini")
        );
    }

    OpenAIReportAiClient reportAiClient(
        envOr("OPENAI_API_KEY"),
        envOr("OPENAI_BASE_URL", "https://api.openai.com"),
        envOr("OPENAI_REPORT_MODEL", "gpt-4o-mini"),
        std::stoi(envOr("OPENAI_TIMEOUT_MS", "30000"))
    );

    InterviewService interviewService(*interviewProvider, sessionRepo);
    ReportService reportService(sessionRepo, reportRepo, reportAiClient);

    InterviewController controller(interviewService, reportService);
    InterviewRoutes routes(httpServer, controller);

    routes.registerRoutes();
    httpServer.start();
    return 0;
}
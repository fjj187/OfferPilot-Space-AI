#include <windows.h>
#include <memory>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <filesystem>

#include "Config/app_config.hpp"
#include "http_server.hpp"
#include "providers/MockInterviewProviders.hpp"
#include "providers/OpenAIInterviewProvider.hpp"
#include "Client/OpenAIReportAiClient.hpp"
#include "MySQLConn.hpp"
#include "repositories/MySQLSessionRepository.hpp"
#include "repositories/MySQLReportRepository.hpp"
#include "repositories/MySQLAuthUserRepository.hpp"
#include "repositories/MySQLAuthSessionRepository.hpp"
#include "services/InterviewService.hpp"
#include "services/ReportService.hpp"
#include "services/AuthService.hpp"
#include "Controller/AuthController.hpp"
#include "Routes/AuthRoutes.hpp"
#include "Controller/interview_controller.hpp"
#include "Routes/InterviewRoutes.hpp"

static std::string envOr(const char* key, const std::string& fallback = "") {
    const char* value = std::getenv(key);
    return value ? std::string(value) : fallback;
}

static std::string envOrAny(std::initializer_list<const char*> keys, const std::string& fallback = "") {
    for (const char* key : keys) {
        const char* value = std::getenv(key);
        if (value && *value) {
            return std::string(value);
        }
    }
    return fallback;
}

static std::string trim(const std::string& text) {
    const auto first = text.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) {
        return {};
    }
    const auto last = text.find_last_not_of(" \t\r\n");
    return text.substr(first, last - first + 1);
}

static void loadEnvFile(const std::filesystem::path& filePath) {
    std::ifstream in(filePath);
    if (!in.is_open()) {
        return;
    }

    std::string line;
    while (std::getline(in, line)) {
        const auto normalizedLine = trim(line);
        if (normalizedLine.empty() || normalizedLine.front() == '#') {
            continue;
        }

        const auto eqPos = normalizedLine.find('=');
        if (eqPos == std::string::npos) {
            continue;
        }

        const auto key = trim(normalizedLine.substr(0, eqPos));
        auto value = trim(normalizedLine.substr(eqPos + 1));
        if (key.empty() || value.empty()) {
            continue;
        }

        if ((value.front() == '"' && value.back() == '"') || (value.front() == '\'' && value.back() == '\'')) {
            value = value.substr(1, value.size() - 2);
        }

        const char* existingValue = std::getenv(key.c_str());
        if (existingValue == nullptr || *existingValue == '\0') {
            _putenv_s(key.c_str(), value.c_str());
        }
    }
}

static std::filesystem::path getExecutableDir() {
    wchar_t buffer[MAX_PATH];
    const auto len = GetModuleFileNameW(nullptr, buffer, MAX_PATH);
    if (len == 0 || len >= MAX_PATH) {
        return std::filesystem::current_path();
    }

    return std::filesystem::path(buffer).parent_path();
}

int main() {
    SetConsoleOutputCP(65001);
    SetConsoleCP(65001);

    const auto exeDir = getExecutableDir();
    loadEnvFile((exeDir / ".." / ".env").lexically_normal());
    loadEnvFile((std::filesystem::current_path() / ".env").lexically_normal());

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

    MySQLConn mysqlConn;
    if (!mysqlConn.connect(config.dbUser, config.dbPassword, config.dbName, config.dbHost, static_cast<unsigned short>(config.dbPort))) {
        return 1;
    }

    MySQLSessionRepository sessionRepo(mysqlConn);
    MySQLReportRepository reportRepo(mysqlConn);
    MySQLAuthUserRepository authUserRepo(mysqlConn);
    MySQLAuthSessionRepository authSessionRepo(mysqlConn);
    PasswordHasher passwordHasher;

    std::unique_ptr<InterviewProvider> interviewProvider;
    const bool useMock = envOr("USE_MOCK_INTERVIEW_PROVIDER") == "1";

    if (useMock) {
        interviewProvider = std::make_unique<MockInterviewProvider>();
    } else {
        interviewProvider = std::make_unique<OpenAIInterviewProvider>(
            envOrAny({
                "OPENAI_API_KEY",
                "ALIYUN_API_KEY",
                "DASHSCOPE_API_KEY",
                "INTERVIEW_REMOTE_API_KEY"
            }),
            envOrAny({
                "OPENAI_BASE_URL",
                "ALIYUN_BASE_URL",
                "DASHSCOPE_BASE_URL",
                "INTERVIEW_REMOTE_BASE_URL"
            }, "https://api.openai.com/v1"),
            envOrAny({
                "OPENAI_INTERVIEW_MODEL",
                "ALIYUN_INTERVIEW_MODEL",
                "DASHSCOPE_INTERVIEW_MODEL",
                "INTERVIEW_REMOTE_MODEL"
            }, "gpt-4o-mini")
        );
    }

    OpenAIReportAiClient reportAiClient(
        envOrAny({
            "OPENAI_API_KEY",
            "ALIYUN_API_KEY",
            "DASHSCOPE_API_KEY",
            "INTERVIEW_REMOTE_API_KEY"
        }),
        envOrAny({
            "OPENAI_BASE_URL",
            "ALIYUN_BASE_URL",
            "DASHSCOPE_BASE_URL",
            "INTERVIEW_REMOTE_BASE_URL"
        }, "https://api.openai.com/v1"),
        envOrAny({
            "OPENAI_REPORT_MODEL",
            "ALIYUN_REPORT_MODEL",
            "DASHSCOPE_REPORT_MODEL",
            "INTERVIEW_REMOTE_MODEL"
        }, "gpt-4o-mini"),
        std::stoi(envOr("OPENAI_TIMEOUT_MS", "30000"))
    );

    InterviewService interviewService(*interviewProvider, sessionRepo);
    ReportService reportService(sessionRepo, reportRepo, reportAiClient);

    AuthService authService(
        authUserRepo,
        authSessionRepo,
        passwordHasher,
        std::stoi(envOr("AUTH_TOKEN_TTL_SECONDS", "86400"))
    );

    InterviewController controller(interviewService, reportService);
    InterviewRoutes routes(httpServer, controller);

    AuthController authController(authService);
    AuthRoutes authRoutes(httpServer, authController);
    authRoutes.registerRoutes();

    routes.registerRoutes();

    httpServer.start();
    return 0;
}

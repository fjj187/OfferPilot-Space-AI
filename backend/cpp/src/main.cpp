#include <windows.h>

#include "app_config.hpp"
#include "http_server.hpp"
#include "providers/MockInterviewProviders.hpp"
#include "repositories/JsonSessionRepository.hpp"
#include "services/InterviewService.hpp"
#include "interview_controller.hpp"
#include "InterviewRoutes.hpp"

int main(){
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
    MockInterviewProvider provider;
    JsonSessionRepository sessionRepo("data/interview_sessions.json");
    InterviewService service(provider, sessionRepo);
    InterviewController controller(service);
    InterviewRoutes routes(httpServer, controller);

    routes.registerRoutes();
    httpServer.start();

    return 0;
}
#include "Routes/AuthRoutes.hpp"

AuthRoutes::AuthRoutes(HttpServer& httpServer, AuthController& controller)
    : m_httpServer(httpServer), m_controller(controller) {}

void AuthRoutes::registerRoutes() {
    m_httpServer.post("/api/auth/login",
        [this](const httplib::Request& req, httplib::Response& res) {
            m_controller.login(req, res);
        });

    m_httpServer.get("/api/auth/me",
        [this](const httplib::Request& req, httplib::Response& res) {
            m_controller.me(req, res);
        });

    m_httpServer.post("/api/auth/logout",
        [this](const httplib::Request& req, httplib::Response& res) {
            m_controller.logout(req, res);
        });
}
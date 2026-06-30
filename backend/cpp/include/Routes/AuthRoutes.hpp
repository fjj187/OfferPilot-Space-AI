#pragma once
#include "http_server.hpp"
#include "Controller/AuthController.hpp"

class AuthRoutes {
public:
    AuthRoutes(HttpServer& httpServer, AuthController& controller);
    void registerRoutes();

private:
    HttpServer& m_httpServer;
    AuthController& m_controller;
};
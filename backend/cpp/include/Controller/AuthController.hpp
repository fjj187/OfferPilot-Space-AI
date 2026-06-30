#pragma once
#include "httplib.h"
#include "json.hpp"
#include "services/AuthService.hpp"

class AuthController {
public:
    explicit AuthController(AuthService& authService);

    void login(const httplib::Request& req, httplib::Response& res);
    void me(const httplib::Request& req, httplib::Response& res);
    void logout(const httplib::Request& req, httplib::Response& res);

private:
    LoginRequestDto parseLoginRequest(const std::string& body) const;
    void sendJson(httplib::Response& res, int status, const nlohmann::json& payload) const;

    AuthService& m_authService;
};
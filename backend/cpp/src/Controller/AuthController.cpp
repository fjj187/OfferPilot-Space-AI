#include "Controller/AuthController.hpp"

AuthController::AuthController(AuthService& authService)
    : m_authService(authService) {}

void AuthController::login(const httplib::Request& req, httplib::Response& res) {
    try {
        const auto dto = parseLoginRequest(req.body);
        const auto result = m_authService.login(dto.username, dto.password);

        if (!result.has_value()) {
            sendJson(res, 401, {
                {"error", -1},
                {"msg", "invalid credentials"}
            });
            return;
        }

        sendJson(res, 200, {
            {"token", result->token},
            {"user", {
                {"username", result->user.username},
                {"role", result->user.role},
                {"displayName", result->user.displayName}
            }}
        });
    }
    catch (const std::exception& e) {
        sendJson(res, 400, {
            {"error", -1},
            {"msg", e.what()}
        });
    }
}

void AuthController::me(const httplib::Request& req, httplib::Response& res) {
    const auto userOpt = m_authService.authenticateByRequest(req);
    if (!userOpt.has_value()) {
        sendJson(res, 401, {
            {"error", -1},
            {"msg", "user not log in"}
        });
        return;
    }

    sendJson(res, 200, {
        {"user", {
            {"username", userOpt->username},
            {"role", userOpt->role},
            {"displayName", userOpt->displayName}
        }}
    });
}

void AuthController::logout(const httplib::Request& req, httplib::Response& res) {
    const auto userOpt = m_authService.authenticateByRequest(req);
    if (!userOpt.has_value()) {
        sendJson(res, 401, {
            {"error", -1},
            {"msg", "user not log in"}
        });
        return;
    }

    const auto auth = req.get_header_value("Authorization");
    const std::string prefix = "Bearer ";
    const auto token = auth.substr(prefix.size());

    m_authService.logout(token);

    sendJson(res, 200, {
        {"ok", true}
    });
}

LoginRequestDto AuthController::parseLoginRequest(const std::string& body) const {
    const auto json = nlohmann::json::parse(body);

    LoginRequestDto dto;
    dto.username = json.value("username", "");
    dto.password = json.value("password", "");

    if (dto.username.empty() || dto.password.empty()) {
        throw std::runtime_error("username and password are required");
    }

    return dto;
}

void AuthController::sendJson(httplib::Response& res, int status, const nlohmann::json& payload) const {
    res.status = status;
    res.set_content(payload.dump(), "application/json");
}
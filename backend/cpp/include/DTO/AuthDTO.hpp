#pragma once
#include <string>

struct AuthUserDto {
    std::string username;
    std::string role;        // "user" | "admin"
    std::string displayName;
};

struct LoginRequestDto {
    std::string username;
    std::string password;
};

struct LoginResponseDto {
    std::string token;
    AuthUserDto user;
};

struct MeResponseDto {
    AuthUserDto user;
};
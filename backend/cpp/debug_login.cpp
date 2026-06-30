#include <iostream>
#include "services/AuthService.hpp"
#include "repositories/JsonAuthUserRepository.hpp"
#include "repositories/JsonAuthSessionRepository.hpp"
#include "Hasher/PasswordHasher.hpp"
int main(){
  try {
    JsonAuthUserRepository userRepo("data/auth_users.json");
    JsonAuthSessionRepository sessionRepo("data/auth_sessions.json");
    PasswordHasher h;
    AuthService s(userRepo, sessionRepo, h, 86400);
    auto r = s.login("admin", "admin");
    std::cout << (r ? "login_ok" : "login_fail") << "\n";
    if (r) {
      std::cout << r->token << "\n";
      std::cout << r->user.username << "\n";
    }
  } catch (const std::exception& e) {
    std::cout << "EX:" << e.what() << "\n";
  }
}

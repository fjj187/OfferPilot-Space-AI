#include <iostream>
#include "repositories/JsonAuthUserRepository.hpp"
#include "Hasher/PasswordHasher.hpp"
int main(){
  try {
    JsonAuthUserRepository repo("data/auth_users.json");
    auto user = repo.findByUsername("admin");
    if (!user) {
      std::cout << "user_not_found\n";
      return 0;
    }
    std::cout << "user_found\n";
    std::cout << user->username << "\n";
    std::cout << user->salt << "\n";
    std::cout << user->passwordHash << "\n";
    PasswordHasher h;
    std::cout << (h.verify("admin", user->salt, user->passwordHash) ? "verify_ok" : "verify_fail") << "\n";
  } catch (const std::exception& e) {
    std::cout << "EX:" << e.what() << "\n";
  }
}

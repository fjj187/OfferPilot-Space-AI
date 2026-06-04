#include "../include/MySQLConn.hpp"
#include "../include/ReportRepository.hpp"
#include "../include/ReportCommandHandler.hpp"
#include <windows.h>
#include <iostream>
#include <string>
#include "../third_part/json.hpp"
using namespace std;


int main() {
    SetConsoleOutputCP(65001);          // 设置控制台输出为 UTF-8
    SetConsoleCP(65001);                // 设置控制台输入为 UTF-8
    
    MySQLConn conn;
    bool success = conn.connect("root", "123456", "yuzhouyemian", "127.0.0.1", 3306);
    if (success) {
        cout << "数据库连接成功！" << endl;
    } else {
        cout << "{\"success\":false,\"error\":\"Database connection failed\"}" << endl;
        return 1;
    }
    ReportRepository repository(&conn);
    ReportCommandHandler handler(repository);
    std::string line;
    while (getline(cin, line)) {
        try {
        nlohmann::json j = nlohmann::json::parse(line);
        std::string action = j["action"].get<std::string>();
        std::string jsonPayload = j["payload"].dump();
        if (action == "insert") {
            cout << handler.handleInsert(jsonPayload) << endl;
        } else if (action == "update") {
            cout << handler.handleUpdate(jsonPayload) << endl;
        } else if (action == "get") {
            cout << handler.handleGet(jsonPayload) << endl;
        } else if (action == "list") {
            cout << handler.handleList(jsonPayload) << endl;
        } else if (action == "delete") {
            cout << handler.handleDelete(jsonPayload) << endl;
        } else {
            cout << handler.errorResponse("Invalid action") << endl;
        }
    } catch (const std::exception& e) {
        cout << handler.errorResponse(string("Parse error: ") + e.what()) << endl;
    }
    }
    return 0;
}
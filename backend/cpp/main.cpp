#include "MySQLConn.hpp"
#include <windows.h>
#include <iostream>
using namespace std;


int main() {
    SetConsoleOutputCP(65001);          // 设置控制台输出为 UTF-8
    SetConsoleCP(65001);                // 设置控制台输入为 UTF-8
    
    MySQLConn conn;
    bool success = conn.connect("root", "123456", "yuzhouyemian", "127.0.0.1", 3306);
    if (success) {
        cout << "数据库连接成功！" << endl;
        if (conn.query("SELECT * FROM users LIMIT 1")) {
            if (conn.next()) {
                cout << "查询成功，用户ID: " << conn.value(0) << endl;
            }
        }
    } else {
        cout << "数据库连接失败" << endl;
    }
    return 0;
}
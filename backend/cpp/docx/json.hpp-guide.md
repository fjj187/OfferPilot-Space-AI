# nlohmann::json 使用指南

这份文档面向当前 `backend/cpp` 项目，重点说明 `json.hpp` 的常用写法、和你项目里最相关的序列化方式、以及容易踩坑的地方。

## 1. 基本概念

`nlohmann::json` 是一个 C++ 单头文件 JSON 库。

常见用法：

```cpp
#include "json.hpp"

nlohmann::json j;
j["name"] = "Alice";
j["age"] = 18;
```

读取：

```cpp
std::string name = j["name"];
int age = j["age"];
```

## 2. 创建 JSON

### 对象

```cpp
nlohmann::json j = {
    {"name", "Alice"},
    {"age", 18}
};
```

### 数组

```cpp
nlohmann::json arr = nlohmann::json::array();
arr.push_back("a");
arr.push_back("b");
```

## 3. 常用访问方式

### `contains()`

判断字段是否存在：

```cpp
if (j.contains("name")) {
    // ...
}
```

### `at()`

访问已知存在的字段，找不到会抛异常：

```cpp
auto name = j.at("name").get<std::string>();
```

### `value()`

读取字段并提供默认值：

```cpp
std::string name = j.value("name", "unknown");
int age = j.value("age", 0);
```

## 4. `get<T>()` 和 `get_to()`

### `get<T>()`

返回一个值：

```cpp
std::string name = j.at("name").get<std::string>();
```

### `get_to()`

把值写入已有变量：

```cpp
std::string name;
j.at("name").get_to(name);
```

项目里 `loadFromFile()` 这种代码更适合 `get_to()`。

## 5. 自定义类型序列化

如果你有自己的结构体，比如：

```cpp
struct User {
    std::string name;
    int age;
};
```

可以定义：

```cpp
static void to_json(nlohmann::json& j, const User& u) {
    j = {
        {"name", u.name},
        {"age", u.age}
    };
}

static void from_json(const nlohmann::json& j, User& u) {
    j.at("name").get_to(u.name);
    j.at("age").get_to(u.age);
}
```

之后就可以直接：

```cpp
nlohmann::json j = user;
User user2 = j.get<User>();
```

## 6. `optional` 的处理

对于 `std::optional<T>`，推荐先判断字段是否存在：

```cpp
std::optional<std::string> name;
if (j.contains("name")) {
    j.at("name").get_to(name);
}
```

如果字段可能是 `null`，也要额外判断：

```cpp
if (j.contains("name") && !j["name"].is_null()) {
    j.at("name").get_to(name);
}
```

## 7. 你当前项目里的典型写法

### 会话仓库

`JsonSessionRepository` 适合：

- `to_json` / `from_json` 定义在 `.cpp` 顶部
- 用 `root["sessions"] = m_sessions`
- 用 `item.get_to(session)` 或手动字段解析

### 报告仓库

`JsonReportRepository` 适合：

- 手动解析嵌套 `optional`
- 对 `practicePlan` 这种对象先判断 `null`
- 先写临时文件，再重命名替换正式文件

## 8. 常见坑

### 8.1 `get_to()` 找不到重载

通常原因：

- 没写 `from_json`
- `from_json` 作用域不对
- 对象里有嵌套类型没实现反序列化
- `optional<T>` 没先判断 `null`

### 8.2 `item.get_to(report)` 失败

如果结构体很复杂，尤其有：

- `std::optional`
- `std::vector<自定义类型>`
- 嵌套结构体

建议改成手动读取字段。

### 8.3 字段名不一致

比如代码里写的是：

```cpp
answerSnapshot
```

但 JSON 文件里是：

```json
"answer_snapshots"
```

会直接导致读取失败或字段丢失。

## 9. 建议

你现在项目里最稳的方式是：

- 简单结构体用 `to_json/from_json`
- 复杂对象用手动解析
- `optional` 字段先判断 `contains()` 和 `is_null()`
- JSON 文件格式保持固定


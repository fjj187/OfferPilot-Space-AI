# cpp-httplib 使用指南

这份文档只讲你当前项目里用得到的部分。

---

## 1. `httplib` 是什么

`httplib` 是一个轻量级 C++ HTTP 库。

你在这个项目里会用它做三件事：
- 启动 HTTP 服务
- 注册路由
- 处理普通 JSON 接口和 SSE 流式接口

---

## 2. 核心对象

### 2.1 `httplib::Server`

这是服务端主对象。

常见用途：
- `Get(...)`
- `Post(...)`
- `Options(...)`
- `listen(...)`
- `stop()`

你项目里的封装类是 `HttpServer`，本质上就是包了一层 `httplib::Server`。

---

## 3. 路由注册

### 3.1 `Get`

```cpp
m_server.Get("/path", [](const httplib::Request& req, httplib::Response& res) {
    res.set_content("ok", "text/plain");
});
```

作用：
- 注册 GET 请求

参数：
- 第一个参数：路由路径
- 第二个参数：处理函数

---

### 3.2 `Post`

```cpp
m_server.Post("/path", [](const httplib::Request& req, httplib::Response& res) {
    res.set_content("ok", "text/plain");
});
```

作用：
- 注册 POST 请求

你项目里的 `/api/interview/stream` 就应该用它。

---

### 3.3 `Options`

```cpp
m_server.Options("*", [](const httplib::Request& req, httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
    res.set_content("", "text/plain");
});
```

作用：
- 处理浏览器的预检请求
- 常用于 CORS

`"*"` 表示所有路由都接受 OPTIONS。

---

## 4. 请求和响应对象

### 4.1 `httplib::Request`

常见成员：
- `req.body`
- `req.path`
- `req.method`
- `req.get_param_value(...)`

你项目里常见用法：

```cpp
auto body = nlohmann::json::parse(req.body);
```

这表示把请求体当成 JSON 解析。

如果请求是 `GET /api?a=1`，可以这样取参数：

```cpp
std::string v = req.get_param_value("a");
```

---

### 4.2 `httplib::Response`

常见用法：

```cpp
res.set_content("{\"ok\":true}", "application/json");
res.set_header("Content-Type", "application/json");
res.status = 400;
```

你会经常用到：
- `set_content(...)`
- `set_header(...)`
- `status`

---

## 5. 普通响应

### 5.1 `set_content`

```cpp
res.set_content("hello", "text/plain");
```

作用：
- 设置响应正文
- 第二个参数是 MIME 类型

常见 MIME：
- `text/plain`
- `application/json`
- `text/html`
- `text/event-stream`

---

## 6. SSE 流式响应

你的面试回答接口用的是 SSE。

### 6.1 SSE 基本格式

每条消息通常长这样：

```text
event: chunk
data: hello

```

关键点：
- `event:` 表示事件名
- `data:` 表示数据
- 每条事件用空行结尾

---

### 6.2 `set_chunked_content_provider`

这是你项目里最重要的一个接口。

```cpp
res.set_chunked_content_provider(
    "text/event-stream",
    [this](size_t, httplib::DataSink& sink) {
        std::string data = "event: chunk\ndata: hello\n\n";
        sink.write(data.c_str(), data.size());
        return false;
    });
```

作用：
- 服务器分块输出数据
- 适合流式生成、长连接、SSE

参数：
- 第一个参数：内容类型，通常是 `text/event-stream`
- 第二个参数：回调函数

回调函数参数：
- `size_t offset`：当前块偏移
- `httplib::DataSink& sink`：写数据用的对象

写数据：

```cpp
sink.write(data.c_str(), data.size());
```

返回值：
- `false`：本次流结束
- `true`：后面还有数据

---

### 6.3 项目里怎么用

在 `InterviewController::streamInterview()` 里：

1. 先解析 JSON
2. 再调用 `InterviewService::streamInterview()`
3. 把服务层回调的事件写到 `sink`

示例：

```cpp
res.set_chunked_content_provider("text/event-stream",
    [this, request](size_t, httplib::DataSink& sink) {
        m_service.streamInterview(
            request,
            [&](const InterviewStreamEvent& event) {
                if (event.type == InterviewStreamEventType::Chunk && event.content) {
                    auto payload = "event: chunk\ndata: " + *event.content + "\n\n";
                    sink.write(payload.c_str(), payload.size());
                }
            });
        return false;
    });
```

---

## 7. 中间件

### 7.1 `set_pre_routing_handler`

```cpp
m_server.set_pre_routing_handler([](const httplib::Request&, httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    return httplib::Server::HandlerResponse::Unhandled;
});
```

作用：
- 在路由处理前统一加公共响应头
- 常用来加 CORS

返回值：
- `Unhandled`：继续走后续路由

---

## 8. 错误处理

### 8.1 `set_error_handler`

```cpp
m_server.set_error_handler([](const httplib::Request&, httplib::Response& res) {
    if (res.status == 404) {
        res.set_content("{\"success\":false,\"error\":\"Not Found\"}", "application/json");
    }
});
```

作用：
- 统一处理错误响应

你项目里可以先从 404 开始做统一返回。

---

## 9. 启动和停止

### 9.1 `listen`

```cpp
m_server.listen("0.0.0.0", 8080);
```

作用：
- 启动服务
- 绑定地址和端口

---

### 9.2 `stop`

```cpp
m_server.stop();
```

作用：
- 停止服务

---

## 10. 你这个项目里最常用的写法

### 普通 JSON 接口

```cpp
m_server.Post("/api/test", [](const httplib::Request& req, httplib::Response& res) {
    auto body = nlohmann::json::parse(req.body);
    res.set_content("{\"ok\":true}", "application/json");
});
```

### SSE 接口

```cpp
res.set_header("Content-Type", "text/event-stream; charset=utf-8");
res.set_chunked_content_provider("text/event-stream",
    [](size_t, httplib::DataSink& sink) {
        std::string data = "event: done\ndata: {}\n\n";
        sink.write(data.c_str(), data.size());
        return false;
    });
```

---

## 11. 在你项目里的使用分工

- `HttpServer`
  - 负责封装 `httplib::Server`
- `InterviewRoutes`
  - 负责注册路由
- `InterviewController`
  - 负责解析请求和写响应
- `InterviewService`
  - 负责业务

这是最重要的分层边界。


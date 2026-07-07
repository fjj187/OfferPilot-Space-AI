# C++后端与前端联调交付说明

这份文档给前端同学直接联调使用。

## 1. 已准备好的交付物

后端主程序与依赖文件都已放在 `backend/cpp/` 下：

- `backend/cpp/offerpilot_backend.exe`
- `backend/cpp/lib/` 下的运行依赖 DLL
- `backend/cpp/build.bat`

当前仓库里这些文件已纳入 git 跟踪，前端拉取仓库后可以直接看到。

## 2. 运行依赖文件

主程序依赖：

- `backend/cpp/lib/libmysql.dll`
- `backend/cpp/lib/libssl-3-x64.dll`
- `backend/cpp/lib/libcrypto-3-x64.dll`
- `backend/cpp/lib/VCRUNTIME140.dll`
- `backend/cpp/lib/VCRUNTIME140_1.dll`
- `backend/cpp/lib/MSVCP140.dll`

另外，C++ 后端会从环境变量读取 MySQL 和模型配置。

## 3. 端口说明

- 后端 HTTP 端口：`3030`
- 前端开发端口：`2048`

前端开发环境下，`/api` 会通过 Vite 代理转发到 `http://localhost:3030`。

## 4. 环境变量说明

### C++ 后端必需

- `HTTP_PORT`，默认 `3030`
- `DB_HOST`，默认 `127.0.0.1`
- `DB_PORT`，默认 `3306`
- `DB_NAME`
- `DB_USER`，默认 `root`
- `DB_PASSWORD`

### C++ 后端可选

- `USE_MOCK_INTERVIEW_PROVIDER=1`，启用本地 mock provider
- `INTERVIEW_REMOTE_API_KEY`
- `INTERVIEW_REMOTE_BASE_URL`
- `INTERVIEW_REMOTE_MODEL`
- `AUTH_TOKEN_TTL_SECONDS`

### 前端联调可选

- `VITE_INTERVIEW_BACKEND_ORIGIN=http://localhost:3030`
- `VITE_INTERVIEW_SSE_URL=`，留空时开发环境默认走 `/api/interview/stream`

## 5. 启动命令

在 `backend/cpp/` 目录下启动：

```bat
offerpilot_backend.exe
```

如果需要先编译：

```bat
build.bat
```

前端启动：

```bash
pnpm dev
```

## 6. 最小联调步骤

1. 先启动 C++ 后端，确认 `http://localhost:3030/api/health` 返回 `{"success":true,"message":"ok"}`。
2. 再启动前端，打开 `http://localhost:2048`。
3. 登录后进入 `#/showcase/mock-interview-space`。
4. 在模拟面试页里输入一段回答，点击底部 `提交回答并继续追问`。
5. 观察消息区是否开始出现流式返回；如果处于生成中，按钮会变成 `停止生成`。

## 7. SSE 验证点

前端 SSE 入口是 `POST /api/interview/stream`。

联调时只要满足以下几点，就说明链路通了：

- 点击提交后，页面能进入流式状态
- 消息区能持续追加服务端返回内容
- 结束后能正常落到 `done`

## 8. 备注

如果后端切到远程模型模式，请确保：

- MySQL 可连接
- `DB_NAME` 已填写
- 远程模型 API Key 已配置

如果只做前端联调，也可以先用 mock provider 起服务，再切到真实模型。

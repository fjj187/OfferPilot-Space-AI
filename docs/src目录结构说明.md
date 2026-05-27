# src 目录结构说明

这份文档用于快速说明 `src` 下面每个主要文件夹和关键文件是做什么的，方便后续开发时判断代码应该放在哪里。

当前项目的 `src` 可以简单理解成几层：

- 应用入口层
- 页面与场景层
- 业务状态层
- 通用组件层
- 基础能力层
- 类型与样式层

---

## 根目录文件

`main.ts`

- Vue 应用入口
- 挂载路由、Pinia、样式、Naive UI 等基础能力

`App.vue`

- 应用最外层组件
- 一般只负责承载路由出口和全局外壳

`NaiveProvider.vue`

- Naive UI 的 Provider 包装层
- 一般用于主题、消息、弹层等全局 UI 上下文

`env.d.ts`

- Vite / TypeScript 的环境声明补充

`shims-vue.d.ts`

- Vue 单文件组件的类型声明

---

## views

`src/views` 放页面级组件，也就是路由真正对应的页面。

这里是“用户访问哪个页面，就最终落到哪个 vue 文件上”的地方。

### workbench

`src/views/workbench`

- 旧版工作台主页面集合
- 现在仍然保留了很多真实业务逻辑和数据承接能力
- 后续宇宙页如果要继续做大改，很多内容都要从这里搬过去

主要文件含义：

`layout.vue`

- 工作台整体布局页
- 承载 overview、library、mock-interview、report、history 等子页面

`overview.vue`

- 旧版总览页
- 现在主要承担训练状态承接逻辑的参考来源

`library.vue`

- 旧版资料库页
- 现在最接近“真实资料工作区”的页面
- 包含导入、资料列表、筛选、预览等逻辑

`mock-interview.vue`

- 旧版模拟面试页
- 当前真实面试主链路最完整的页面
- 包含 session、题目推进、回答输入、流式追问、完成后生成报告等逻辑

`practice.vue`

- 专项刷题页
- 负责弱项定向训练这条链路

`report.vue`

- 复盘报告页
- 承接 session 结果、弱项标签、建议项等

`history.vue`

- 历史记录页
- 查看之前的训练 session 和报告

`*.data.ts`

- 对应页面的本地展示数据或演示数据
- 比如 `overview.data.ts`、`library.data.ts`、`mock-interview.data.ts`

### showcase

`src/views/showcase`

- 宇宙风展示页面
- 当前你正在重点开发的就是这里

主要文件：

`mock-interview-space.vue`

- 当前宇宙主页面
- 现在正在往“总览、资料库、模拟面试、专项刷题、报告”一体化宇宙页方向发展

`space-odyssey.vue`

- 另一个展示页或宇宙风实验页
- 更偏视觉验证，不一定是当前主业务入口

### 其他页面

`chat.vue`

- 早期聊天页或旧入口页
- 现在不是主要开发重点

---

## components

`src/components` 放可复用组件。

这些组件一般不会直接作为路由页面使用，而是被 `views` 里的页面拼装起来。

这个目录目前有两类东西混在一起：

- 当前业务组件
- 早期通用组件和旧结构组件

### workbench

`src/components/workbench`

- 旧版工作台页面使用的通用业务组件
- 比如总览卡片、头部、内容容器、主题切换 chips

### library

`src/components/library`

- 资料库页专用组件
- 比如导入卡、资料列表项、资料预览面板、筛选 tabs

如果后面要把旧版资料库搬进宇宙页，这一组组件会是重点复用对象。

### mock-interview

`src/components/mock-interview`

- 模拟面试页专用组件
- 比如回答输入区、面试上下文栏、追问操作栏、弱项追踪卡、资料引用卡

如果后面要把旧版面试能力继续往宇宙页里搬，这组组件也会频繁用到。

### report

`src/components/report`

- 报告页组件
- 比如报告总览卡、建议卡、弱项区块

### history

`src/components/history`

- 历史列表组件
- 比如训练 session 列表、报告列表

### message

`src/components/message`

- 聊天消息流组件
- 负责消息列表、消息气泡、Markdown 渲染入口、流式光标等

这是模拟面试对话区的重要基础组件。

### MarkdownPreview

`src/components/MarkdownPreview`

- Markdown 渲染能力
- 包含 markdown 解析、代码高亮、预处理、模型定义等

### 其他通用目录

`Layout`

- 旧布局组件

`Navigation`

- 导航栏、侧边栏、页脚等导航组件

`IconFont`、`IconifyIcon`

- 图标组件封装

`ClipBoard`

- 复制功能组件

`Pagination`、`TableList`、`CustomTooltip`

- 通用 UI 功能组件

`404.vue`

- 404 页面组件

---

## composables

`src/composables` 放组合式状态逻辑，也就是 Vue 3 的 composable。

这里适合放“跨页面复用的业务状态”和“跨组件复用的逻辑”。

当前几个关键文件：

`useWorkbenchPersistence.ts`

- 工作台业务持久化封装
- 负责读取和保存 workbench context、interview session、report summary、library documents

`useInterviewStream.ts`

- 面试流式消息相关逻辑封装
- 管理消息列表、流式状态、用户消息、系统消息等

`useOverviewLaunchState.ts`

- 总览启动状态共享层
- 用来统一承接总览页需要的主题、模式、资料来源、训练进度、弱项、主动作等信息

后面如果要把资料库场景做成真正的资料工作区，也很可能会继续新增：

- `useLibraryWorkspaceState.ts` 这一类文件

---

## services

`src/services` 放更偏业务服务层的能力。

和 `utils` 的区别是：

- `utils` 更偏纯工具函数
- `services` 更偏具体业务服务

当前主要有两块：

### sse

`src/services/sse`

- SSE 连接和流式通信相关逻辑
- 包括客户端、类型定义、面试流处理

### message

`src/services/message`

- 面试消息解析和消息队列相关逻辑
- 给流式面试对话提供消息处理支持

---

## store

`src/store` 放 Pinia store 和相关扩展。

当前项目里 store 不是特别重，很多业务状态已经偏向 composable + 本地持久化。

这里主要包括：

- store 入口
- store hooks
- plugins
- 一些 business 或 utils 扩展

如果未来全局状态变复杂，这里可能会继续扩展。

---

## router

`src/router` 放路由配置。

主要文件：

`routes.ts`

- 总路由表

`child-routes.ts`

- 子路由定义
- 包含 workbench 和 showcase 这些页面的具体路由

`index.ts`

- 路由实例创建

`permission.ts`

- 路由权限或前置守卫逻辑

---

## types

`src/types` 放 TypeScript 类型定义。

这是业务结构收口的重要目录。

比较关键的文件：

`workbench.ts`

- 工作台相关核心类型
- 包括资料、训练 session、报告摘要、上下文等

`message.ts`

- 消息流相关类型

`global.d.ts`、`index.d.ts`

- 全局或补充类型声明

---

## utils

`src/utils` 放纯工具函数和辅助能力。

这里的代码一般不直接表达业务页面，而是给上层业务提供基础工具。

例如：

- `request.ts` 请求封装
- `files-tool.ts` 文件处理辅助
- `location.ts` 路径或地址辅助
- `number.ts` 数字处理
- `type.ts` 类型工具

### storage

`src/utils/storage`

- 本地存储相关工具
- 当前 `workbench-storage.ts` 是工作台持久化的底层读写封装

---

## hooks

`src/hooks` 放偏轻量的可复用 hooks。

和 `composables` 的区别可以简单理解成：

- `hooks` 更轻，偏工具化
- `composables` 更重，偏业务状态化

比如这里有：

- 主题切换
- 复制文本
- 获取当前组件实例

---

## styles

`src/styles` 放全局样式和样式变量。

主要包括：

- 全局样式
- 主题变量
- Naive UI 变量覆盖
- Markdown 样式

如果后面宇宙页要进一步统一视觉，这里也可能继续调整。

---

## assets

`src/assets` 放静态资源。

当前包括：

- 图片
- svg
- 字体

这类文件一般不写逻辑，只做资源引用。

---

## api

`src/api`

- 接口封装入口
- 当前内容不多，更多像是预留层

如果后面接真实后端，这里会逐步变重要。

---

## config

`src/config`

- 项目配置层
- 放环境变量读取、配置项聚合等内容

---

## data

`src/data`

- 放静态数据或演示数据
- 比如 `mock-md.md`

一般用于演示、测试或本地模拟内容。

---

## base

`src/base`

- 项目初始化或底层基座代码
- 当前体量不大，更像早期结构预留

---

## 现在这个项目最值得优先关注的目录

如果你现在的目标是继续做宇宙页主链路，最值得重点看的就是这些目录：

- `src/views/showcase`
- `src/views/workbench`
- `src/components/library`
- `src/components/mock-interview`
- `src/components/report`
- `src/composables`
- `src/utils/storage`
- `src/types`

可以简单理解成：

- `showcase` 是正在建设的新宇宙主页面
- `workbench` 是旧版但真实可用的业务内容来源
- `components/library`、`components/mock-interview`、`components/report` 是后续搬运时最容易复用的现成组件
- `composables`、`types`、`storage` 是状态和数据结构真正收口的地方

---

## 一句话记忆方式

如果只想快速记住：

- `views` 放页面
- `components` 放页面里拼装的小块
- `composables` 放复用业务逻辑
- `services` 放业务服务
- `store` 放全局状态
- `utils` 放工具函数
- `types` 放类型
- `styles` 放样式
- `assets` 放资源
- `router` 放路由

当前真正和你这条开发线最相关的核心文件，是：

- `src/views/showcase/mock-interview-space.vue`
- `src/views/workbench/library.vue`
- `src/views/workbench/mock-interview.vue`
- `src/views/workbench/report.vue`
- `src/composables/useOverviewLaunchState.ts`
- `src/composables/useWorkbenchPersistence.ts`

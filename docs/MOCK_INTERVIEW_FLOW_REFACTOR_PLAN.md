# Mock Interview Flow 小重构方案

## 背景

当前 `mock-interview-space` 的主链路已经能跑通，但在最近几轮联调里连续暴露出一批相似问题：

- 点击按钮无反应
- 从报告页返回 mock 后进入空态
- 清空历史后还能看到旧历史
- “查看上次模拟历史”有时显示、有时打不开
- 结束本轮切报告时，中间帧会闪空

这些问题表面上分散，实际都指向同一个核心：**mock / report / history 相关状态没有在一开始被统一建模，导致多个状态源同时参与决策，链路语义也不够收口。**

这份方案的目标不是做大重构，而是做一轮**小而关键的结构收敛**，把最容易反复出问题的主链路先稳定下来。

---

## 为什么要重构

### 1. 状态源过多，且职责交叉

当前这块功能同时依赖：

- 组件内响应式状态
- `interview sessions` 持久化
- `report summaries` 持久化
- `history preview` 临时态
- `workbench context`

这些状态都在参与：

- 当前页面该显示什么
- 当前是否有历史可查看
- 再来一轮该按什么配置重开
- 清空历史时到底该删哪些数据

问题在于：**不同按钮、不同页面并没有始终读取同一个“真相源”。**

所以会出现：

- A 按钮判断“有历史”，B 页面判断“没有历史”
- 页面切回 mock，但配置没有恢复
- 清掉当前数据，历史预览或更老的 session 又被重新捞出来

### 2. 关键动作语义不统一

当前几个核心动作都存在“UI 文案像一个动作，代码里却是另一种实现”的情况：

- `清空对话历史`
- `查看上次模拟历史`
- `再来一轮模拟`
- `结束本轮并查看报告`

例如：

- “再来一轮模拟”有时只是切回 mock 页面，而不是重新开一轮
- “清空对话历史”有时只清当前 session，有时历史预览还在
- “查看上次模拟历史”显示条件和实际打开条件不完全一致

这说明这些动作还没有被抽象成统一的领域命令，而是散落在 view / scene / composable 中各自拼装。

### 3. UI 场景切换和业务流转耦合过深

当前很多交互的真实语义不是“切页面”，而是：

- 结束 session
- 冻结快照
- 生成报告摘要
- 清理当前轮状态
- 恢复某份上下文
- 进入历史预览

但现在不少逻辑是“先切页面，再让其他状态自己跟上”。  
这会导致：

- 切页成功，但状态未准备好
- 状态清了，页面还持有旧视图
- 页面恢复了，配置没恢复

### 4. 事件透传链过长

像总览页“先导入资料”按钮无反应的问题，本质就是中间层漏转发了一个事件。

这不是单点偶发失误，而是说明当前交互链路过长：

- Scene
- General Panel
- Content Panel
- View

只要中间少一段 `emit`，交互就会失效。

---

## 当前问题的根因总结

可以把本轮暴露的问题归成一句话：

> 当前 `mock-interview-space` 缺少一个统一的 flow 层来定义“当前处于什么业务阶段、当前哪份数据是唯一有效的、每个按钮动作到底意味着什么”。

因此现在很多逻辑都是：

- 多个状态源一起猜
- 多个组件分段处理
- 页面切换和状态修补混在一起

这也是为什么一个看起来很小的问题，经常会牵动别的链路。

---

## 重构目标

这次小重构只做三件事：

1. **统一主链路状态**
2. **统一关键动作语义**
3. **降低页面切换对业务状态的干扰**

目标不是把整个模块重写，而是把以下三条链路先收稳：

- mock 作答链路
- report 收尾 / 再来一轮链路
- history preview / 清空历史链路

---

## 重构范围

本次重构限定在 `mock-interview-space` 内，优先改以下模块：

- `src/views/showcase/mock-interview-space.vue`
- `src/composables/showcase/useMockInterviewSpaceMockState.ts`
- `src/composables/showcase/useMockInterviewSpaceReportScene.ts`
- `src/components/showcase/mock-interview-space/scenes/*`

不在这次范围内的内容：

- 全局路由结构
- 资料页导入能力本身
- workbench 其他页面的数据结构重做

---

## 重构方案

### 一、建立统一的 Flow 层

建议新增一个专门处理业务流的模块，例如：

- `src/composables/showcase/useMockInterviewFlow.ts`

它负责统一维护 mock interview space 的流程状态，而不是让这些判断散落在多个组件里。

建议统一收口这些核心状态：

- `flowMode: 'idle' | 'mock' | 'report' | 'history_preview'`
- `activeSessionId: string`
- `previewSessionId: string`
- `lastReplayConfig`
- `currentRoundSnapshot`
- `hasRestorableHistory`
- `draft`

其中最关键的是两个：

### `flowMode`

它定义当前业务阶段，而不是单纯定义 UI 场景。

例如：

- `idle`：当前没有可继续的 mock，会展示空态
- `mock`：当前正在进行一轮 mock
- `report`：当前展示某轮 mock 的报告态
- `history_preview`：当前正在查看历史快照

### `lastReplayConfig`

它定义“再来一轮模拟”应该使用什么配置重新开始，而不是靠多个地方拼凑。

应至少包含：

- `entryMode`
- `activeDocumentId`
- `practicePlan`
- `questionType`
- `questionCount`
- `difficulty`
- `topic`
- `mode`

---

### 二、把关键按钮动作改成统一命令

现在各个按钮背后的行为散落在多个函数里。  
重构后建议统一成领域命令，组件只发命令，不自己拼逻辑。

建议至少收成这些命令：

- `startMockRound(config)`
- `submitAnswer(payload)`
- `finishMockRound()`
- `restartLastMockRound()`
- `openLatestHistoryPreview()`
- `exitHistoryPreview()`
- `clearAllMockHistory()`
- `goToLibrary()`
- `goToPracticeSelector()`
- `goToReport()`

这样以后一个按钮点下去，不再是：

- 改 context 一部分
- 清 session 一部分
- 切 scene
- 靠 watcher 补剩下的状态

而是：

- 执行一个确定命令
- 命令内部统一处理状态
- UI 根据 flow 状态变化响应

---

### 三、统一关键动作语义

这一步非常重要，要先把动作“说清楚”，代码才能稳定。

#### 1. 清空对话历史

**重构前问题**

- 有时只清当前 session
- 有时历史预览还在
- 有时更早的 completed session 又被重新捞出

**重构后定义**

`clearAllMockHistory()` 的语义是：

- 清空全部 mock interview 历史
- 删除所有 `interview sessions`
- 删除所有对应 `report summaries`
- 清空当前预览态
- 清空当前草稿和消息态
- 若当前没有 active round，则回到 `idle`

#### 2. 查看上次模拟历史

**重构前问题**

- 显示条件和实际打开条件不一致
- 没有历史时静默失败

**重构后定义**

`openLatestHistoryPreview()` 的语义是：

- 查找最近一条“可恢复”的 completed session
- 若存在，则进入 `history_preview`
- 若不存在，则统一弹出 `当前无对话历史`

#### 3. 再来一轮模拟

**重构前问题**

- 有时只是切回 mock 页面
- 没有恢复上一轮的资料 / 配置 /专项训练计划

**重构后定义**

`restartLastMockRound()` 的语义是：

- 基于 `lastReplayConfig` 重启一轮新的 mock
- 恢复上一轮对应的资料 / 训练计划 / 出题配置
- 进入 `mock`

#### 4. 结束本轮并查看报告

**重构前问题**

- 切换过程里既依赖当前消息态，又依赖后续清理
- 退场阶段容易闪空

**重构后定义**

`finishMockRound()` 的语义是：

- 冻结当前轮快照
- 完成当前 session
- 生成 report summary
- 保存可复用的 replay config
- 切换到 `report`

---

### 四、把 Scene 组件收缩成纯展示层

当前 `SpaceMockScene`、`SpaceReportScene`、`SpaceOverviewScene` 中仍有部分行为依赖外部多段逻辑拼接。

重构后建议 Scene 组件尽量只做两件事：

1. 接收标准化后的 props
2. 发出语义明确的 action

例如：

- `onPrimaryAction`
- `onOpenHistory`
- `onRestartRound`
- `onClearHistory`

而不是在 scene 中隐式判断：

- 现在有没有历史
- 当前是否应该跳 mock
- 当前是 direct 还是 practice

这些都应该由 flow 层先算好。

---

### 五、把 UI 场景切换改为响应 Flow 状态

当前很多地方是主动调用：

- `openSceneContent('mock')`
- `openSceneContent('report')`
- `openSceneContent('library')`

建议后续逐步过渡到：

- 业务命令修改 `flowMode`
- 页面根据 `flowMode` 和场景意图渲染对应界面

例如：

- `startMockRound` -> `flowMode = 'mock'`
- `finishMockRound` -> `flowMode = 'report'`
- `openLatestHistoryPreview` -> `flowMode = 'history_preview'`
- `clearAllMockHistory` -> `flowMode = 'idle'`

这样可以减少“页面切到了，但状态还没同步好”的问题。

---

## 重构后的变化

### 1. 状态结构会更清楚

重构前：

- 当前状态由多个 composable + context + session + preview 临时态共同决定

重构后：

- 当前处于什么流程、操作哪份数据，由 flow 层单点定义

### 2. 按钮链路会更稳定

重构前：

- 一个按钮可能要经过多层组件转发
- 中间少一个 emit 就会失效

重构后：

- 按钮只负责发统一 action
- 父层只负责调统一命令

### 3. 页面切换不会再依赖“状态自己补齐”

重构前：

- 切换成功不代表业务状态正确

重构后：

- 先完成业务动作
- 再由状态驱动 UI 呈现

### 4. 后续功能更容易扩展

后面如果再加：

- 恢复未完成 mock
- 基于报告继续练弱项
- 指定某次历史重新演练

可以直接基于 flow 层扩展，而不是继续在页面里补分支。

---

## 预期效果

### 用户侧效果

重构后，用户侧应明显减少以下问题：

- 点按钮没有反应
- 切换页面后进入错误空态
- 清空历史后仍能看到旧历史
- 历史提示与实际内容不一致
- 报告返回 mock 时配置丢失

### 开发侧效果

开发层面会有这些直接收益：

- 问题更容易定位
- 功能扩展更可控
- 状态链路更可读
- 不同入口对同一行为的定义更一致

### 稳定性效果

后续继续调整下列功能时，互相影响会明显下降：

- mock 题目流转
- report 展示
- history preview
- overview 入口动作

---

## 推荐实施步骤

建议分三步实施，不要一口气重写。

### 第一步：统一命令语义

先把下面这些动作收口成统一命令：

- `finishMockRound`
- `restartLastMockRound`
- `openLatestHistoryPreview`
- `clearAllMockHistory`

这是收益最大、风险最可控的一步。

### 第二步：建立 flow 状态层

新增 `useMockInterviewFlow.ts`，把以下状态收进去：

- `flowMode`
- `activeSessionId`
- `previewSessionId`
- `lastReplayConfig`
- `hasRestorableHistory`

让 view 不再直接从多个来源拼装判断。

### 第三步：瘦身 view 和 scene

逐步把：

- `mock-interview-space.vue`
- `SpaceMockScene.vue`
- `SpaceReportScene.vue`

中的业务分支迁出，只保留数据展示和事件抛出。

---

## 验收标准

这轮小重构完成后，至少应满足以下链路稳定：

### 链路 1：结束并查看报告

1. 在 mock 中作答
2. 点击“结束本轮并查看报告”
3. 报告页正常打开
4. 退场过程不闪空

### 链路 2：报告页再来一轮

1. 完成一轮 mock
2. 进入报告页
3. 点击“再来一轮模拟”
4. 按上一轮配置重新生成题目
5. 不进入空态

### 链路 3：查看历史

1. 完成至少一轮 mock
2. 点击“查看上次模拟历史”
3. 正常进入历史预览
4. 无历史时弹出 `当前无对话历史`

### 链路 4：清空历史

1. 有多轮历史记录
2. 点击“清空对话历史”
3. 所有 mock 历史和对应报告记录被删除
4. 再点击历史入口时只弹无历史提示

### 链路 5：总览入口

1. 在总览页点击 `先导入资料`
2. 正常进入资料页
3. 无中间层事件丢失

---

## 一句话总结

这次重构的本质，不是“把代码写得更漂亮”，而是把现在这块功能从：

**多个状态源共同猜测当前流程**

收敛成：

**单一 flow 状态 + 统一业务命令**

这样后面继续扩展 mock / report / history 能力时，问题会更少，定位会更快，链路也会更稳。

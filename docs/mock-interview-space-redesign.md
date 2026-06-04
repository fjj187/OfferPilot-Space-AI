# 面试页宇宙风改版方案

## 目标

把现有 `mock-interview` 页面从“工作台卡片堆叠型”改成“宇宙科技、简洁、沉浸、信息聚焦型”界面。

核心目标只有 4 个：

1. 用统一的深色宇宙背景替换现在偏普通的白底工作台视觉。
2. 减少卡片数量，避免一个页面里出现太多信息块和多层滚动条。
3. 保留真正影响面试体验的核心信息，弱化次要信息。
4. 让页面更像“单一任务界面”，而不是“后台管理面板”。

---

## 当前页面的问题

当前文件：`src/views/workbench/mock-interview.vue`

主要问题：

1. `WorkbenchContentShell` 带来的壳层感太重，边框、圆角、白底、分栏都在强调“工作台”。
2. 页面同时存在多块信息卡片：
   - `InterviewContextBar`
   - `InterviewGuidePanel`
   - `WeaknessTrackerCard`
   - `SourceReferenceCard`
   - `InterviewActionBar`
   - `AnswerInputPanel`
3. 信息层级不够清晰，用户第一眼很难知道“现在最该做什么”。
4. 多处内部滚动让体验割裂，缺少沉浸感。
5. 视觉语言和你现在做的宇宙展示页不统一。

---

## 目标风格

参考方向：你现在的 `space-odyssey` 页面风格，但要比展示页更克制、更工具化。

关键词：

- 深色宇宙背景
- 微光、星点、轻雾
- 大留白
- 少卡片
- 强主任务
- 轻面板
- 单滚动轴

不建议保留的旧气质：

- 大量白卡片
- 明显工作台边框
- 左右都能滚
- 多组重复信息摘要

---

## 建议保留的内容

这些是面试页真正有价值的部分，建议保留：

1. 当前题目 / 当前轮次
2. 对话消息流 `MessageList`
3. 回答输入区 `AnswerInputPanel`
4. 关键操作：
   - 提交回答
   - 停止生成
   - 下一题
   - 查看提示
5. 弱项标签，但不需要单独大卡片
6. 资料来源提示，但不需要单独大卡片

---

## 建议删除或合并的内容

### 1. 删除 `WorkbenchContentShell` 的白色工作台壳

现在的外层壳会直接破坏宇宙风。

建议：

- 面试页不要再使用默认白底内容壳
- 直接在 `mock-interview.vue` 内部搭自己的全屏深色布局

### 2. 合并顶部信息

现在的 `InterviewContextBar`、部分 `InterviewGuidePanel`、部分 `InterviewActionBar` 信息可以合并为一个顶部状态条。

保留：

- 当前主题
- 模式
- 进度
- 来源

不要再拆成多个卡片。

### 3. 弱项卡片改成轻量标签带

`WeaknessTrackerCard` 不要继续做独立卡片。

改成：

- 对话区上方或下方的一行 tags
- 最多展示 3-5 个
- 可展开查看更多

### 4. 资料来源卡片改成侧边抽屉或悬浮说明

`SourceReferenceCard` 不要常驻占空间。

改成：

- 一个小型 “Source” 按钮
- 点击展开右侧轻抽屉 / 浮层

### 5. 引导面板改成可折叠模式

`InterviewGuidePanel` 不要默认展开成大块内容。

改成：

- 默认收起
- 仅在“引导模式”下显示一个 `Hint` 按钮
- 用户需要时展开

---

## 新页面结构建议

建议改成三段式，但视觉上是一整块连续场景。

### A. 顶部状态区

位置：页面顶部，透明/半透明悬浮

内容：

- 页面标题：`Mock Interview`
- 当前主题
- 当前模式
- 进度：`2 / 4`
- 一个轻操作区：暂停、结束、返回

视觉要求：

- 高度薄
- 半透明
- 与宇宙背景融合
- 不要像后台导航条

### B. 中央主任务区

页面主角，优先级最高。

布局建议：

- 左上：当前题目标题
- 中部：消息流 `MessageList`
- 底部：输入区 `AnswerInputPanel`

其中：

- 题目标题要大，但不要像 marketing hero
- 消息区宽度控制在舒服的阅读长度
- 输入区固定在底部，像驾驶舱面板

### C. 辅助信息区

只保留轻量版本，不占主舞台。

建议变成：

- 一行弱项标签
- 一个 `Hint` 按钮
- 一个 `Source` 按钮
- 一个 `Next Question` 按钮

扩展信息用：

- 抽屉
- 浮层
- 折叠区

不要大卡片常驻。

---

## 视觉实现建议

### 背景

直接复用你现在 `space-odyssey` 的背景思路，但弱化展示感，增强稳定性：

- 深蓝/靛蓝主底
- 少量星点噪声
- 低强度 nebula
- 1 个大虚化行星或光晕放在右下/右侧
- 顶部轻玻璃态导航

注意：

- 面试页背景要稳定，不要像 showcase 那样频繁切换大场景
- 最多做轻微呼吸感和粒子漂移

### 卡片策略

从“很多卡片”改成“只有必要面板”：

- 消息流容器：可保留一个轻描边容器
- 输入面板：保留一个固定底部面板
- 其他信息不要再做卡片

### 颜色

推荐：

- 背景：深蓝黑
- 主文字：高对比白
- 次文字：蓝灰
- 强调色：青蓝 / 冰蓝
- 风险或弱项：低饱和橙 / 琥珀

不要：

- 大面积纯白面板
- 太多颜色状态同时出现

---

## 交互原则

### 1. 单滚动轴

目标：尽量只保留消息流这一个核心滚动，或者整个页面单滚动。

不建议：

- 页面滚
- 卡片也滚
- 侧栏也滚

### 2. 输入区固定

回答输入区要像任务主控台：

- 固定底部
- 永远可见
- 不受上方辅助信息干扰

### 3. 提示与来源按需展开

默认隐藏辅助内容，只在用户需要时打开。

### 4. 进度更直观

用更轻的方式表达进度：

- 顶部 `2 / 4`
- 或细进度条

不需要大块统计卡片。

---

## 推荐的新组件组织

建议保留现有业务逻辑，先只改壳和布局，不先动数据流。

### 保留逻辑

- `useInterviewStream`
- `useWorkbenchPersistence`
- 当前题目推进逻辑
- 回答提交逻辑

### 适合保留但要重做外观的组件

- `MessageList`
- `AnswerInputPanel`
- `InterviewActionBar`
- `InterviewContextBar`

### 适合降级为轻量模块的组件

- `InterviewGuidePanel`
- `WeaknessTrackerCard`
- `SourceReferenceCard`

---

## 实施路径

### 第一阶段：先换壳，不动业务

目标：最快得到“宇宙风面试页”

做法：

1. `mock-interview.vue` 去掉 `WorkbenchContentShell`
2. 改成全屏深色背景布局
3. 只保留：
   - 顶部状态区
   - 中央消息区
   - 底部输入区
4. 把弱项 / 来源 / 提示先折叠到小按钮

这是收益最高的一步。

### 第二阶段：减少组件存在感

做法：

1. 把 `WeaknessTrackerCard` 改成 tags 行
2. 把 `SourceReferenceCard` 改成抽屉
3. 把 `InterviewGuidePanel` 改成折叠浮层

### 第三阶段：动效统一

做法：

1. 顶部状态条加入轻微渐隐
2. 背景加入慢速漂移
3. 输入面板加入微玻璃态
4. 切题时只做轻过渡，不做大幅切场

---

## 落地到当前仓库的建议改动

优先改这些文件：

- `src/views/workbench/mock-interview.vue`
- `src/components/mock-interview/InterviewContextBar.vue`
- `src/components/mock-interview/InterviewActionBar.vue`
- `src/components/mock-interview/InterviewGuidePanel.vue`
- `src/components/mock-interview/SourceReferenceCard.vue`
- `src/components/mock-interview/WeaknessTrackerCard.vue`
- `src/components/mock-interview/AnswerInputPanel.vue`

建议新增：

- `src/components/mock-interview/InterviewTopHud.vue`
- `src/components/mock-interview/InterviewAssistDrawer.vue`

---

## 最终页面应该长什么样

一句话版本：

“像宇宙任务控制台，而不是学习平台后台页。”

用户第一眼应该看到：

1. 当前正在回答哪一题
2. AI 对话正在如何推进
3. 输入框就在眼前
4. 其他信息都不吵

---

## 推荐结论

最稳的方案不是“给原页面加一个宇宙背景”，而是：

**保留原有面试业务逻辑，重做页面壳层、信息结构和组件存在感。**

也就是说：

- 逻辑不推翻
- 布局彻底重做
- 卡片大幅减少
- 背景和氛围统一成宇宙科技风

这样成本可控，而且最终效果会明显比现在高级。


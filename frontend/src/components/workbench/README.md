# Legacy Workbench Components（旧工作台组件 · 已冻结）

> **状态**：Legacy / Frozen — 仅服务于 `src/views/workbench/`，不再接受新功能开发。

## 说明

- 本目录组件仅供旧工作台布局与页面使用（如 `WorkbenchSidebar`、`OverviewHero` 等）。
- 宇宙模拟面试页（`showcase/mock-interview-space`）**不应**引用本目录组件；新 UI 请放在 `src/components/showcase/mock-interview-space/`。
- 与旧工作台共用的业务能力（模拟面试输入、报告卡片等）应放在领域目录：`mock-interview/`、`report/`、`library/`。

## 删除时机

待 `src/views/workbench/` 整体移除且确认无 import 引用后，本目录可一并删除。

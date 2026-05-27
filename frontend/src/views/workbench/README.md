# Legacy Workbench Views（旧工作台页面 · 已冻结）

> **状态**：Legacy / Frozen — 不再对外展示，也不再接受新功能开发。

## 说明

- 本目录为旧版工作台（`/workspace/*`）的页面入口，产品主流程已迁移至 `src/views/showcase/mock-interview-space.vue`（宇宙模拟面试页）。
- 路由与跳转已在 `src/config/product.ts` 中通过 `LEGACY_WORKBENCH_ENABLED = false` 默认隐藏；直接访问 `/workspace/*` 会被重定向到宇宙页。
- **保留原因**：部分共享逻辑与类型仍可能被领域层引用；后续确认无依赖后再整体删除，不在此目录继续迭代。

## 临时调试

若需本地对比旧工作台行为，将 `src/config/product.ts` 中 `LEGACY_WORKBENCH_ENABLED` 改为 `true` 后重启开发服务器。

## 新功能落点

| 场景 | 应改动的目录 |
|------|-------------|
| 宇宙页 UI / 场景 | `src/views/showcase/`、`src/components/showcase/mock-interview-space/` |
| 跨场景共享业务 UI | `src/components/mock-interview/`、`library/`、`report/` 等 |
| 状态与流程 | `src/composables/showcase/` |

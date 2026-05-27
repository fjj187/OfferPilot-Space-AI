# Composables（组合函数）

业务状态与流程编排统一放在本目录，按职责分子目录：

| 子目录 | 用途 | 示例 |
|--------|------|------|
| `showcase/` | 宇宙模拟面试页专用 | `useMockInterviewSpaceMockState.ts` |
| `interview/` | 跨场景面试流 | `useInterviewStream.ts` |
| `workspace/` | 工作台上下文、资料库、持久化（宇宙页与 legacy 共用） | `useWorkbenchPersistence.ts` |
| `ui/` | 通用 UI 辅助（原 `hooks/`） | `useTheme.ts`、`useCopyCode.ts` |

## 约定

- **新增文件**请放入与场景匹配的子目录，不要放在 `composables/` 根级。
- `ui/` 内函数由 `unplugin-auto-import` 全局自动导入（见 `vite.config.ts`）。
- 其他子目录需显式 `import`。

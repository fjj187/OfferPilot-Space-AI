# Storage Services（本地持久化）

浏览器 `localStorage` 读写，供 composable 与工具函数调用。

| 文件 | 职责 |
|------|------|
| `workbench-storage.ts` | 资料库、面试会话、报告摘要等核心键值 |
| `material-pool-storage.ts` | 资料题库池 |
| `practice-pool-storage.ts` | 专项刷题池 |

从原 `utils/storage/` 迁入；含 IO 与业务键名，归属 service 层而非纯 utils。

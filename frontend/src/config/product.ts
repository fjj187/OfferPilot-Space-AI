/**
 * 产品入口开关：旧工作台代码保留在仓库中，但默认不对用户暴露。
 * 需要临时调试 legacy 工作台时，可将 LEGACY_WORKBENCH_ENABLED 改为 true。
 */
export const LEGACY_WORKBENCH_ENABLED = false

/** 默认应用入口路由名（宇宙模拟面试页） */
export const DEFAULT_APP_ROUTE_NAME = 'MockInterviewSpaceShowcase' as const
